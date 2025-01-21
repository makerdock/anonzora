# anonworld

https://anon.world


## Adding Credentials

TODO: Make this more dev friendly

1. Add new credential type in `packages/common/src/types/credentials`
2. Implement credential verifier in `packages/credentials/src/verifiers`
3. Add UI display components to `packages/react/src/components/credentials/types`
4. Add UI verification form to `packages/react/src/components/credentials/new/form`
5. Add opengraph image to `apps/anonworld/app/posts/[hash]/opengraph-image.tsx`
6. Add opengraph metadata generation to `apps/anonworld/app/posts/[hash]/page.tsx`
