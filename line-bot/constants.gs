const SPREADSHEET_ID    = '1-ta-orEvI-_KYVBOWsuyT6KbCu9Q4Yo1uTefneThKaA';
const CHANNEL_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('CHANNEL_ACCESS_TOKEN');

const SHEET_DATA    = 'data';
const SHEET_MESSAGE = 'message';
const SHEET_SERVER  = 'server';
const SHEET_STATUS  = 'status';

const SITE1_URL = 'https://www.neconome.com/S0K01.html?bkn_cd=003180&tab=2';
const SITE2_URL = 'https://mlit3.ncall.info/g01/niigata01/index.cgi?k=0';
const SITE1_UA  = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';

const BUSINESS_START_MIN = 8 * 60 + 30;
const BUSINESS_END_MIN   = 17 * 60 + 30;
