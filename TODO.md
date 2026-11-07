# TODO: client screenshots for the carousel

The client carousel (liquid WebGL, `src/components/ClientCarousel.tsx`) has one slide per client. Add 3 to 4 per client.

1. Put screenshots in `public/clients/`. Landscape, about 1600px wide, ratio near 1.85:1.
   Example names: buildcraft-01.png, buildcraft-02.png, clinic-01.png, clinic-02.png
2. In `src/data.ts`, add one entry per screenshot to `clientSlides`, keeping the same `projectId`:

   {
     projectId: 'buildcraft',
     src: '/clients/buildcraft-02.png',
     title: 'BuildCraft',
     subtitle: 'Services page',
     description: 'One line about what this screenshot shows.',
     link: 'https://build-craft-lilac.vercel.app/',
   },

3. Interleave clients (BuildCraft, Clinic, BuildCraft, Clinic) so the carousel alternates.
4. No code changes are needed. Check it at 1440 wide and on mobile after adding.
