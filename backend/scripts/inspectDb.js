const {PrismaClient} = require('@prisma/client');
(async()=>{const p=new PrismaClient();try{const r=await p.$queryRawUnsafe('select current_user, session_user, current_database()');console.log(r);}catch(e){console.error(e);}finally{await p.$disconnect();}})();
