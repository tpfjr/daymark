import {parseCalendar,parseHolidays} from './calendar-import.mjs';
self.onmessage=event=>{try{const {text,range,holidays}=event.data;self.postMessage({result:holidays?parseHolidays(text,range):parseCalendar(text,range)})}catch(error){self.postMessage({error:error.message})}};
