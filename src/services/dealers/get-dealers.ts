import csv from 'csv-parser';
import fs from 'fs';

import getDealerApiMethods from '@app/clients/dealers/get-dealers-api-methods';
import parseSeat from '@middlewares/dealers-middleware/parsers/parse-seat';
import parseSkoda from '@middlewares/dealers-middleware/parsers/parse-skoda';
import parseVw from '@middlewares/dealers-middleware/parsers/parse-vw';
import { Brand } from '@ts-types/brand.t';
import { DealerSeat, DealerSkoda, DealerVW } from '@ts-types/dealers.t';

type GenericDealer = DealerSeat | DealerSkoda | DealerVW;

const readCsv = (filePath) => new Promise((resolve) => {
  let results = [];
  fs.createReadStream(filePath)
    .pipe(csv({ headers: ['kvps'] }))
    .on('data', (data) => results.push(data))
    .on('end', () => {
      resolve(results);
    });
});

const getDealers = (brand: Brand) =>
  getDealerApiMethods(brand)
    .get()
    .then(async (dealers: GenericDealer[]) => {
      if (brand === 'seat') return parseSeat(dealers as DealerSeat[]);
      if (brand === 'skoda') return parseSkoda(dealers as DealerSkoda[]);
      if (brand === 'cupra') {
        const listKvps = await readCsv('./src/data/cupra-kvps.csv');
        const cupra = dealers.filter((dealer) => listKvps.some((filter) => filter.kvps === dealer.kvps_de));

        return parseSeat(cupra as DealerSeat[]);
      }

      return parseVw(dealers as DealerVW[]);
    });

export default getDealers;
