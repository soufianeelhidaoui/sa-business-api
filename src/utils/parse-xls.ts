import xlsx from 'node-xlsx';
import { XLS_STATUSES } from '@constants/file-handling-messages';

const checkXlsHeadersValidityStatus = (headers : Array<string>) => {
    const requiredHeaders = [
      'Référence',
    ];
  
    const hasEveryHeader = requiredHeaders.every((rh) => headers.includes(rh));
    if (!hasEveryHeader) return XLS_STATUSES.INVALID_XLS_HEADER_NAMES;
  
    return (XLS_STATUSES.VALID_XLS_HEADERS);
  };
  
  const parseXls = (filepath: String) => {
    const [{ data: [headers = [], ...data] }] = xlsx.parse(filepath);
    console.log("🚀 ~ parseXls ~ filepath:", filepath)
    const headersValidityStatus = checkXlsHeadersValidityStatus([...headers]);
  
    if (headersValidityStatus) throw new Error('Invalid Headers');
  
    return { data, headers };
  };

  export default parseXls