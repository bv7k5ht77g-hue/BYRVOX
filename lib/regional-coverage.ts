// Editorial regions include the wider Caribbean community. Belize and Guyana
// remain distinct countries; Brazil is covered under Latin America.
export const regionalCountries: Record<string, readonly string[]> = {
  Europe: ['France', 'Royaume-Uni'],
  Caraïbes: ['Haïti', 'Jamaïque', 'République dominicaine', 'Cuba', 'Bahamas', 'Barbade',
    'Trinité-et-Tobago', 'Guadeloupe', 'Martinique', 'Porto Rico', 'Dominique', 'Sainte-Lucie',
    'Grenade', 'Antigua-et-Barbuda', 'Saint-Kitts-et-Nevis', 'Saint-Vincent-et-les-Grenadines',
    'Belize', 'Guyana', 'Suriname'],
  'Amérique latine': ['Brésil'],
};

export const countryAliases: Record<string, string[]> = {
  France: ['France'], 'Royaume-Uni': ['Royaume-Uni', 'United Kingdom', 'UK'],
  Haïti: ['Haïti', 'Haiti'], Jamaïque: ['Jamaïque', 'Jamaique', 'Jamaica'],
  'République dominicaine': ['République dominicaine', 'Republique dominicaine', 'Dominican Republic', 'República Dominicana'],
  Cuba: ['Cuba'], Bahamas: ['Bahamas'], Barbade: ['Barbade', 'Barbados'],
  'Trinité-et-Tobago': ['Trinité-et-Tobago', 'Trinidad and Tobago'],
  Guadeloupe: ['Guadeloupe'], Martinique: ['Martinique'], 'Porto Rico': ['Porto Rico', 'Puerto Rico'],
  Dominique: ['Dominique', 'Dominica'], 'Sainte-Lucie': ['Sainte-Lucie', 'Saint Lucia'],
  Grenade: ['Grenade', 'Grenada'], 'Antigua-et-Barbuda': ['Antigua-et-Barbuda', 'Antigua and Barbuda'],
  'Saint-Kitts-et-Nevis': ['Saint-Kitts-et-Nevis', 'Saint-Christophe-et-Niévès', 'Saint Kitts and Nevis'],
  'Saint-Vincent-et-les-Grenadines': ['Saint-Vincent-et-les-Grenadines', 'Saint Vincent and the Grenadines'],
  Belize: ['Belize', 'Bélize'], Guyana: ['Guyana'], Suriname: ['Suriname', 'Surinam'],
  Brésil: ['Brésil', 'Bresil', 'Brazil', 'Brasil'],
};

export const countryKeywords: Record<string, readonly string[]> = {
  France: ['France'],
  'Royaume-Uni': ['Royaume-Uni', 'britannique', 'britanniques', 'Grande-Bretagne'],
  Haïti: ['Haïti', 'haïtien', 'haïtienne', 'haïtiens', 'haïtiennes', 'Port-au-Prince', 'Île-à-Vache'],
  Jamaïque: ['Jamaïque', 'jamaïcain', 'jamaïcaine', 'jamaïcains', 'jamaïcaines'],
  'République dominicaine': ['République dominicaine', 'dominicain', 'dominicaine', 'dominicains', 'dominicaines'],
  Cuba: ['Cuba', 'cubain', 'cubaine'], Bahamas: ['Bahamas', 'bahamien', 'bahamienne'],
  Barbade: ['Barbade', 'barbadien', 'barbadienne'],
  'Trinité-et-Tobago': ['Trinité-et-Tobago', 'Trinidad and Tobago'],
  Guadeloupe: ['Guadeloupe', 'guadeloupéen', 'guadeloupéenne'],
  Martinique: ['Martinique', 'martiniquais', 'martiniquaise'],
  'Porto Rico': ['Porto Rico', 'Puerto Rico', 'portoricain', 'portoricaine'],
  Dominique: ['la Dominique', 'Dominica', 'dominiquais', 'dominiquaise'],
  'Sainte-Lucie': ['Sainte-Lucie', 'Saint Lucia'], Grenade: ['la Grenade', 'Grenada', 'grenadien', 'grenadienne'],
  'Antigua-et-Barbuda': ['Antigua-et-Barbuda', 'Antigua and Barbuda'],
  'Saint-Kitts-et-Nevis': ['Saint-Kitts-et-Nevis', 'Saint-Christophe-et-Niévès', 'Saint Kitts and Nevis'],
  'Saint-Vincent-et-les-Grenadines': ['Saint-Vincent-et-les-Grenadines', 'Saint Vincent and the Grenadines'],
  Belize: ['Belize', 'Bélize', 'bélizien', 'bélizienne'],
  Guyana: ['Guyana', 'guyanien', 'guyanienne'], Suriname: ['Suriname', 'Surinam', 'surinamais', 'surinamaise'],
  Brésil: ['Brésil', 'brésilien', 'brésilienne', 'brésiliens', 'brésiliennes'],
};

export function countryRegion(country: string) {
  return Object.entries(regionalCountries).find(([, countries]) => countries.includes(country))?.[0] ?? null;
}

export function regionKeywords(region: string): readonly string[] {
  return (regionalCountries[region] ?? []).flatMap(country => countryKeywords[country] ?? [country]);
}
