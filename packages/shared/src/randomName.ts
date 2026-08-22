// Word-based fallback name for players who leave the name field blank.
// Deliberately excludes "Sheep"/"Wolf" and anything role-suggestive so an
// auto-generated name can never accidentally hint at (or spoil) a role.
const ADJECTIVES = [
  'Quiet',
  'Clever',
  'Sneaky',
  'Bold',
  'Lucky',
  'Sly',
  'Mighty',
  'Swift',
  'Curious',
  'Wild',
  'Brave',
  'Calm',
  'Fierce',
  'Gentle',
  'Sharp',
  'Shadowy',
  'Nimble',
  'Cunning',
  'Daring',
  'Quirky',
];

const NOUNS = [
  'Otter',
  'Falcon',
  'Badger',
  'Fox',
  'Raven',
  'Panther',
  'Lynx',
  'Heron',
  'Cobra',
  'Puma',
  'Hawk',
  'Moose',
  'Bison',
  'Coyote',
  'Jackal',
  'Mongoose',
  'Weasel',
  'Ferret',
  'Gecko',
  'Marten',
];

export function generateRandomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  return `${adjective} ${noun}`;
}
