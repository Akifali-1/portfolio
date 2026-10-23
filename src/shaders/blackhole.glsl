//#define STEP 0.04
//#define NSTEPS 700
#define PI 3.141592653589793238462643383279
#define DEG_TO_RAD (PI/180.0)
#define MAX_BEAMING_INTENSITY 1.28
#define MAX_FINAL_RADIANCE 0.65
#define ROT_Y(a) mat3(1, 0, 0, 0, cos(a), sin(a), 0, -sin(a), cos(a))
#define ROT_Z(a) mat3(cos(a), -sin(a), 0, sin(a), cos(a), 0, 0, 0, 1)


uniform float time;
uniform vec2 resolution;

uniform vec3 cam_pos;
uniform vec3 cam_dir;
uniform vec3 cam_up;
uniform float fov;
uniform vec3 cam_vel;

const float MIN_TEMPERATURE = 1000.0;
const float TEMPERATURE_RANGE = 39000.0;

uniform bool accretion_disk;
uniform bool use_disk_texture;
const float DISK_IN = 2.0;
const float DISK_WIDTH = 4.0;

uniform bool doppler_shift;
uniform bool lorentz_transform;
uniform bool beaming;
uniform float disk_intensity;
uniform bool cool_palette;

uniform sampler2D bg_texture;
uniform sampler2D star_texture;
uniform sampler2D disk_texture;
uniform vec2 screen_offset;

vec2 square_frame(vec2 screen_size){
  vec2 position = 2.0 * (gl_FragCoord.xy / screen_size.xy) - 1.0; 
  position.x -= screen_offset.x;
  position.y -= screen_offset.y;
  return position;
}

vec2 to_spherical(vec3 cartesian_coord){
  // spherical projection
  // polar angles are directly used as horizontal and vertical coordinates
  // here angle to y-axis mapped to latitude (looking vertically 180 degrees)
  // xz plane to longitude (looking horizontally 360 degrees)
  vec2 uv = vec2(atan(cartesian_coord.z,cartesian_coord.x), asin(cartesian_coord.y)); 
  uv *= vec2(1.0/(2.0*PI), 1.0/PI); //long, lat
  uv += 0.5;
  return uv;
}

vec3 lorentz_transform_velocity(vec3 u, vec3 v){ 
  // u = ray
  // v = observer
  float speed = length(v);
  if (speed > 0.0){
    float gamma = 1.0/sqrt(1.0-dot(v,v));
    
    float denominator = 1.0 - dot(v,u);
    
    vec3 new_u = (u/gamma - v + (gamma/(gamma+1.0)) * dot(u,v)*v)/denominator;
    return new_u;
  }
  return u;
}

vec3 ice_silver_palette(float luminance){
  // Preserve the disk texture's detail, but remap its warm orange/red values
  // into the portfolio's midnight, ice-blue, and silver visual language.
  float value = clamp(pow(luminance, 0.84), 0.0, 1.0);
  vec3 midnight = vec3(0.025, 0.065, 0.16);
  vec3 blue = vec3(0.12, 0.34, 0.78);
  vec3 ice = vec3(0.56, 0.82, 1.0);
  vec3 silver = vec3(0.94, 0.98, 1.0);

  vec3 color = mix(midnight, blue, smoothstep(0.0, 0.42, value));
  color = mix(color, ice, smoothstep(0.28, 0.74, value));
  color = mix(color, silver, smoothstep(0.62, 0.98, value));
  return color;
}

vec3 warm_temp_to_color(float temp_kelvin){
  vec3 color;
  temp_kelvin = clamp(temp_kelvin, 1000.0, 40000.0) / 100.0;
  if (temp_kelvin <= 66.0){
    color.r = 255.0;
    color.g = 99.4708025861 * log(max(temp_kelvin, 1.0)) - 161.1195681661;
    color.b = temp_kelvin <= 19.0 ? 0.0 : 138.5177312231 * log(max(temp_kelvin - 10.0, 1.0)) - 305.0447927307;
  } else {
    color.r = 329.698727446 * pow(max(temp_kelvin - 60.0, 0.0), -0.1332047592);
    color.g = 288.122169528 * pow(max(temp_kelvin - 60.0, 0.0), -0.0755148492);
    color.b = 255.0;
  }
  return clamp(color, 0.0, 255.0) / 255.0;
}

vec3 temp_to_color(float temp_kelvin){
  float temperature = clamp((temp_kelvin - 1000.0) / 39000.0, 0.0, 1.0);
  // Keep the blackbody-style temperature progression, but grade it cool so
  // stars and the procedural fallback remain blue-white instead of amber.
  return cool_palette ? ice_silver_palette(mix(0.18, 1.0, temperature)) : warm_temp_to_color(temp_kelvin);
}

vec3 cool_background(vec3 source){
  float luminance = dot(source, vec3(0.2126, 0.7152, 0.0722));
  float warmth = smoothstep(0.0, 0.16, max(source.r - max(source.g, source.b), 0.0));
  vec3 deep_blue = vec3(luminance * 0.18, luminance * 0.34, luminance * 0.62)
    + vec3(0.003, 0.010, 0.028) * smoothstep(0.02, 0.45, luminance);
  vec3 cool_source = mix(source * vec3(0.58, 0.78, 1.08), deep_blue, warmth * 0.7);
  float tint = clamp(0.2 + warmth * 0.52, 0.0, 0.62);
  return mix(source, cool_source, tint);
}

// https://gist.github.com/fieldOfView/5106319
// https://gamedev.stackexchange.com/questions/93032/what-causes-this-distortion-in-my-perspective-projection-at-steep-view-angles
// for reference
void main()	{
  // z towards you, y towards up, x towards your left
  //  float hfov = (2.0 * ((uv.x+0.5)/resolution.x) - 1.0) * d * resolution.x/resolution.y;
  // float vfov = (1.0 - 2.0 * ((uv.y+0.5)/resolution.y)) * d;
  //  float d = tan(fov*DEG_TO_RAD / 2.0);

  float uvfov = tan(fov / 2.0 * DEG_TO_RAD);
  vec2 uv = square_frame(resolution); 

  uv *= vec2(resolution.x/resolution.y, 1.0);
  vec3 forward = normalize(cam_dir); // 
  vec3 up = normalize(cam_up);
  vec3 nright = normalize(cross(forward, up));
  up = cross(nright, forward);
  // generate ray
  vec3 pixel_pos =cam_pos + forward +
                 nright*uv.x*uvfov+ up*uv.y*uvfov;
  
  vec3 ray_dir = normalize(pixel_pos - cam_pos); // 
  
  

  // light aberration alters ray path 
  if (lorentz_transform)
    ray_dir = lorentz_transform_velocity(ray_dir, cam_vel);

  
  // initial color
  vec4 color = vec4(0.0,0.0,0.0,1.0);

  // geodesic by leapfrog integration

  vec3 point = cam_pos;
  vec3 velocity = ray_dir;
  vec3 c = cross(point,velocity);
  float h2 = dot(c,c);

  
  // for doppler effect
  float ray_gamma = 1.0/sqrt(1.0-dot(cam_vel,cam_vel));
  float ray_doppler_factor = ray_gamma * (1.0 + dot(ray_dir, -cam_vel));
    
  float ray_intensity = 1.0;
  if (beaming)
    ray_intensity /= pow(ray_doppler_factor , 3.0);
  // Preserve the initial frame, but stop Doppler beaming from turning later
  // rotations into a clipped white flare.
  ray_intensity = min(ray_intensity, MAX_BEAMING_INTENSITY);
  
  
  vec3 oldpoint; 
  float pointsqr;
  
  float distance = length(point);

  // Leapfrog geodesic
  for (int i=0; i<NSTEPS;i++){ 
    oldpoint = point; // remember previous point for finding intersection
    point += velocity * STEP;
    vec3 accel = -1.5 * h2 * point / pow(dot(point,point),2.5);
    velocity += accel * STEP;    
    
    // distance from origin
    distance = length(point);
    if ( distance < 0.0) break;
    
    bool horizon_mask = distance < 1.0 && length(oldpoint) > 1.0;// intersecting eventhorizon
    // does it enter event horizon?
    if (horizon_mask) {
      vec4 black = vec4(0.0,0.0,0.0,1.0);
      color += black;
      break;
    }
    
    // intersect accretion disk
    if (accretion_disk){
      if (oldpoint.y * point.y < 0.0){
        // move along y axis
        float lambda = - oldpoint.y/velocity.y;
        vec3 intersection = oldpoint + lambda*velocity;
        float r = length(intersection);//dot(intersection,intersection);
        if (DISK_IN <= r&&r <= DISK_IN+DISK_WIDTH ){
          float phi = atan(intersection.x, intersection.z);
          
          vec3 disk_velocity = vec3(-intersection.x, 0.0, intersection.z)/sqrt(2.0*(r-1.0))/(r*r); 
          phi -= time * (0.85 / sqrt(r));
          phi = mod(phi , PI*2.0);
          float disk_gamma = 1.0/sqrt(1.0-dot(disk_velocity, disk_velocity));
          float disk_doppler_factor = disk_gamma*(1.0+dot(ray_dir/distance, disk_velocity)); // from source 
          
          if (use_disk_texture){
          // texture
            vec2 tex_coord = vec2(mod(phi,2.0*PI)/(2.0*PI),1.0-(r-DISK_IN)/(DISK_WIDTH));
            vec4 disk_color = texture2D(disk_texture, tex_coord) / (ray_doppler_factor * disk_doppler_factor);
            disk_color.rgb *= disk_intensity;
            float disk_alpha = clamp(dot(disk_color,disk_color)/4.5,0.0,1.0);
            if (cool_palette) {
              float disk_luminance = dot(disk_color.rgb, vec3(0.2126, 0.7152, 0.0722));
              disk_color.rgb = ice_silver_palette(disk_luminance);
            }

            if (beaming)
              disk_alpha /= pow(disk_doppler_factor,3.0);
            
            color += vec4(disk_color)*disk_alpha;
          } else {
          
          // use blackbody 
          float disk_temperature = 10000.0*(pow(r/DISK_IN, -3.0/4.0));
          
            //doppler effect
          if (doppler_shift)
            disk_temperature /= ray_doppler_factor*disk_doppler_factor;

          vec3 disk_color = temp_to_color(disk_temperature) * disk_intensity;
          float disk_alpha = clamp(dot(disk_color,disk_color)/3.0,0.0,1.0);
          
          if (beaming)
            disk_alpha /= pow(disk_doppler_factor,3.0);
            
          
          color += vec4(disk_color, 1.0)*disk_alpha;
          
          }
        }
      }
    }
    
  }
  
  if (distance > 1.0){
    ray_dir = normalize(point - oldpoint);
    vec2 tex_coord = to_spherical(ray_dir * ROT_Z(45.0 * DEG_TO_RAD));
    // taken from source
    // red = temp
    // green = lum
    // blue = vel 
    vec4 star_color = texture2D(star_texture, tex_coord);
    if (star_color.g > 0.0){
      // Keep the star field concentrated around the black hole. A soft
      // left-side falloff protects the oversized name and editorial copy.
      float screen_x = gl_FragCoord.x / resolution.x;
      float left_star_fade = mix(0.18, 1.0, smoothstep(0.08, 0.52, screen_x));
      float star_temperature = (MIN_TEMPERATURE + TEMPERATURE_RANGE*star_color.r);
      // arbitrarily sets background stars' velocity for random shifts
      float star_velocity = star_color.b - 0.5;
      float star_doppler_factor = sqrt((1.0+star_velocity)/(1.0-star_velocity));
      if (doppler_shift)
        star_temperature /= ray_doppler_factor*star_doppler_factor;
      
      color += vec4(temp_to_color(star_temperature),1.0) * star_color.g * left_star_fade;
    }

    vec3 background_color = texture2D(bg_texture, tex_coord).rgb;
    vec2 screen_uv = gl_FragCoord.xy / resolution.xy;
    vec2 halo_delta = (screen_uv - vec2(resolution.x > 900.0 ? 0.74 : 0.5, 0.42)) * vec2(resolution.x / resolution.y, 1.0);
    if (cool_palette) {
      background_color = cool_background(background_color);
      float blue_halo = 1.0 - smoothstep(0.16, 0.52, length(halo_delta));
      background_color += vec3(0.006, 0.018, 0.045) * blue_halo;
    }
    color += vec4(background_color, 1.0) * 0.25;
// gl_FragColor = color;
  }
  // Keep the starting frame untouched while compressing only pixels that
  // become over-bright after the rotating disk and Doppler beaming combine.
  // This is a display cap, not a global exposure reduction.
  vec3 final_color = color.rgb * ray_intensity;
  float peak_channel = max(final_color.r, max(final_color.g, final_color.b));
  if (peak_channel > MAX_FINAL_RADIANCE)
    final_color *= MAX_FINAL_RADIANCE / peak_channel;

  gl_FragColor = vec4(final_color, 1.0);
}
