// Liste des départements de Côte d'Ivoire (33 départements officiels regroupés)
export const CI_DEPARTMENTS = [
  "Abengourou", "Abidjan", "Aboisso", "Adzopé", "Agboville", "Agnibilékrou",
  "Bangolo", "Béoumi", "Biankouma", "Bondoukou", "Bongouanou", "Bouaflé",
  "Bouaké", "Bouna", "Boundiali", "Dabakala", "Daloa", "Danané",
  "Daoukro", "Dimbokro", "Divo", "Duékoué", "Ferkessédougou", "Gagnoa",
  "Grand-Bassam", "Grand-Lahou", "Guiglo", "Issia", "Katiola", "Korhogo",
  "Lakota", "Man", "Mankono", "Mbahiakro", "Odienné", "Oumé",
  "Sakassou", "San-Pédro", "Sassandra", "Séguéla", "Sinfra", "Soubré",
  "Tabou", "Tanda", "Tiassalé", "Tingréla", "Touba", "Toulépleu",
  "Toumodi", "Vavoua", "Yamoussoukro", "Zuénoula",
] as const;

export type CIDepartment = typeof CI_DEPARTMENTS[number];
