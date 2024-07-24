import axios, { type AxiosInstance } from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { Agent } from 'https';
import config from '@config';

export interface GVFApiClientAuthType {
  authToken: string
  appID: string
}

export class GVFApiClient {
  private readonly client: AxiosInstance;

  constructor () {
    this.client = axios.create({
      baseURL: config.get('VITE_GVF_API_BASE_URL'),
      headers: {
        Accept: 'application/xml',
        'Content-Type': 'application/xml'
      },
      httpsAgent: new Agent({
        rejectUnauthorized: false
      })
    });
  }

  private async isTokenValid (ipAddress: string, auth: GVFApiClientAuthType): Promise<boolean> {
    const payload = `<?xml version="1.0" encoding="ISO-8859-1"?>
  <MESSAGE DTD="XMLMSG" VERSION="1.0">
    <HEADER>
        <ID></ID>
        <AUTHENTICATION_TOKEN>${auth.authToken}</AUTHENTICATION_TOKEN>
        <USERID></USERID>
        <LANG></LANG>
    </HEADER>
    <COMMAND>
        <REQUEST NAME="CheckAuthenticationToken" DTD="PortalDirectory" VERSION="1.1" ID="4711">
            <PARAM NAME="APPLICATION_ID" VALUE="${auth.appID}"/>
            <PARAM NAME="REMOTE_ADDR" VALUE="${ipAddress}"/>
            <PARAM NAME="ELEMENT_GRP" VALUE="ALL"/>
            <PARAM NAME="DIVISION" VALUE="YES"/>
        </REQUEST>
    </COMMAND>
  </MESSAGE>`;

    const response = await this.client.post('', payload, {
      method: 'post',
      responseEncoding: 'binary',
      timeout: 15000
    });

    const parser = new XMLParser({
      attributeNamePrefix: '@_',
      ignoreAttributes: false
    });
    const result = parser.parse(response.data as string);

    return result.MESSAGE.RESULT.RESPONSE.DATA.CHECKAUTHENTICATIONTOKEN.VALID['@_VALUE'] === 'TRUE';
  }

  private async getUserInfo(ipAddress: string, auth: GVFApiClientAuthType): Promise<object> {
    const payload = `<?xml version="1.0" encoding="ISO-8859-1"?>
    <MESSAGE DTD="XMLMSG" VERSION="1.0">
      <HEADER>
          <ID></ID>
          <AUTHENTICATION_TOKEN>${auth.authToken}</AUTHENTICATION_TOKEN>
          <USERID></USERID>
          <LANG></LANG>
      </HEADER>
      <COMMAND>
        <REQUEST NAME="GetCurrentUserData" DTD="PortalDirectory" VERSION="1.1" ID="4711">
          <PARAM NAME="APPLICATION_ID" VALUE="${auth.appID}"/>
          <PARAM NAME="REMOTE_ADDR" VALUE="${ipAddress}"/>
          <PARAM NAME="ELEMENT_GRP" VALUE="ALL"/>
          <PARAM NAME="DIVISION" VALUE="YES"/>
        </REQUEST>
      </COMMAND>
  </MESSAGE>`;

    const response = await this.client.post('', payload, {
      method: 'post',
      responseEncoding: 'binary',
      timeout: 15000
    });
    return response.data;
  }

  async login (auth: GVFApiClientAuthType): Promise<string> {
    const ipAddress = '92.173.81.170';

    const isTokenValid = await this.isTokenValid(ipAddress, auth);
    if (isTokenValid) {
      const userData = await this.getUserInfo(ipAddress, auth);
      return userData;
    }
    return '';
  }
}
