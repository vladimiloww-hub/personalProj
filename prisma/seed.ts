import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const locations = [
  {
    name: "Fisherman's Bastion",
    description: 'A neo-Gothic terrace on Castle Hill adorned with seven towers, each representing one of the Magyar tribes.',
    taskDescription: 'Take a photo from the main terrace with the Parliament building visible across the Danube.',
    lat: 47.5019,
    lng: 19.0345,
    referencePhotoUrl: '/fisherman.png',
    order: 0,
  },
  {
    name: 'Buda Castle',
    description: 'The historic royal palace of the Hungarian kings, crowning the southern tip of Castle Hill.',
    taskDescription: 'Photograph the ornate main gate with the raven-and-ring emblem of King Matthias.',
    lat: 47.4960,
    lng: 19.0398,
    referencePhotoUrl: '/kindCastle.png',
    order: 1,
  },
  {
    name: 'Great Market Hall',
    description: "Budapest's largest and oldest indoor market — a stunning Neo-Gothic iron structure built in 1897.",
    taskDescription: 'Capture the stalls from the upper gallery level, looking down at the main hall.',
    lat: 47.4869,
    lng: 19.0616,
    referencePhotoUrl: '/centralMarket.png',
    order: 2,
  },
  {
    name: 'Hungarian Parliament',
    description: "The grand Neo-Gothic Parliament on the Danube bank — one of Europe's largest legislative buildings.",
    taskDescription: 'Photograph the building from Kossuth Lajos Square, facing the main facade.',
    lat: 47.5071,
    lng: 19.0453,
    referencePhotoUrl: '/parlament.png',
    order: 3,
  },
  {
    name: "St. Stephen's Basilica",
    description: "Budapest's largest church, housing the mummified right hand of Hungary's first king.",
    taskDescription: "Photograph the dome from St. Stephen's Square with the fountain in the foreground.",
    lat: 47.5005,
    lng: 19.0534,
    referencePhotoUrl: '/basilica.png',
    order: 4,
  },
  {
    name: 'House of Terror',
    description: 'A chilling museum in the former headquarters of the secret police, documenting fascist and communist terror.',
    taskDescription: 'Photograph the building facade with its distinctive perforated TERROR letters casting shadows.',
    lat: 47.5089,
    lng: 19.0627,
    referencePhotoUrl: '/thouse.png',
    order: 5,
  },
  {
    name: 'Róth Museum',
    description: 'The preserved workshop and home of Miksa Róth, master of stained glass and mosaics in Art Nouveau Budapest.',
    taskDescription: 'Find and photograph the most intricate stained glass panel inside the museum.',
    lat: 47.5020,
    lng: 19.0795,
    referencePhotoUrl: '/RothMuseum.png',
    order: 6,
  },
]

async function main() {
  console.log('Seeding Budapest locations…')

  for (const loc of locations) {
    await prisma.location.upsert({
      where: { id: `seed-${loc.order}` },
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
