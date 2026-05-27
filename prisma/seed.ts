import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const locations = [
  {
    name: 'Fisherman\'s Bastion',
    description: 'A neo-Gothic terrace overlooking the Danube and Pest, adorned with seven towers.',
    taskDescription: 'Photograph the panoramic view of the Parliament building from the main terrace.',
    lat: 47.5019,
    lng: 19.0345,
    referencePhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Halaszbastya.jpg/1280px-Halaszbastya.jpg',
    order: 0,
  },
  {
    name: 'Matthias Church',
    description: 'A Gothic cathedral in the heart of the Castle District, with its iconic diamond-patterned roof.',
    taskDescription: 'Capture the colorful Zsolnay tile roof from the Fisherman\'s Bastion side.',
    lat: 47.5018,
    lng: 19.0343,
    referencePhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Matthias_Church_Budapest.jpg/1280px-Matthias_Church_Budapest.jpg',
    order: 1,
  },
  {
    name: 'Hungarian Parliament',
    description: 'The grand Neo-Gothic parliament building on the Danube riverbank — one of Europe\'s largest.',
    taskDescription: 'Photograph the building from the Danube bank at the Kossuth Lajos square.',
    lat: 47.5071,
    lng: 19.0453,
    referencePhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/BUDAPEST_PARLAMENTJE.jpg/1280px-BUDAPEST_PARLAMENTJE.jpg',
    order: 2,
  },
  {
    name: 'Széchenyi Chain Bridge',
    description: 'The iconic suspension bridge connecting Buda and Pest, guarded by stone lions.',
    taskDescription: 'Take a photo standing on the bridge with the Buda Castle visible in the background.',
    lat: 47.4982,
    lng: 19.0451,
    referencePhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Chain_bridge_Budapest.jpg/1280px-Chain_bridge_Budapest.jpg',
    order: 3,
  },
  {
    name: 'St. Stephen\'s Basilica',
    description: 'Budapest\'s largest church, housing the mummified right hand of the first king of Hungary.',
    taskDescription: 'Photograph the dome from St. Stephen\'s Square, with the fountain in the foreground.',
    lat: 47.5005,
    lng: 19.0534,
    referencePhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Budapest_-_St._Stephens_Basilica.jpg/1280px-Budapest_-_St._Stephens_Basilica.jpg',
    order: 4,
  },
  {
    name: 'Great Market Hall',
    description: 'Budapest\'s largest and oldest indoor market, a magnificent Neo-Gothic structure built in 1897.',
    taskDescription: 'Capture the stalls from the upper gallery level, looking down at the main hall.',
    lat: 47.4869,
    lng: 19.0616,
    referencePhotoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Great_Market_Hall_Budapest.jpg/1280px-Great_Market_Hall_Budapest.jpg',
    order: 5,
  },
]

async function main() {
  console.log('Seeding Budapest locations…')

  for (const loc of locations) {
    await prisma.location.upsert({
      where: {
        // Use a unique field — we'll use a combination approach
        id: `seed-${loc.order}`,
      },
      update: loc,
      create: { id: `seed-${loc.order}`, ...loc },
    })
    console.log(`✓ ${loc.name}`)
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
