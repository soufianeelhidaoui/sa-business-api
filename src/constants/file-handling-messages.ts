export const COULD_NOT_LOAD_FILE = 'Erreur lors du chargement du fichier, merci de réessayer';

export const XLS_STATUSES = {
  VALID_XLS_HEADERS: '',
  INVALID_XLS_HEADER_NAMES: 'Les colonnes de votre fichier ne contiennent pas les bonnes entêtes.',
  INVALID_DATA_FORMAT: 'Certaines données dans votre fichier ne sont pas au bon format.',
  INVALID_EXTENSION: 'Le fichier doit être au format XLS ou XLSX.',
  PIMCORE_PRICE_MISSMATCH: 'Veuillez charger un fichier avec les prix conseillés à jour.',
  COULD_NOT_LOAD_FILE,
};

export const PDF_STATUSES = {
  INVALID_EXTENSION: 'Le fichier doit être au format PDF.',
  COULD_NOT_LOAD_FILE,
};