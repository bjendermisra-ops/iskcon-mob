/* Reusable first-party share/save API for Radha Krishna Android Hybrid v19.
   Link navigation is user-initiated; Android handles HTTPS action routes.
   For a new page just include <script src="temple-share.js" defer></script> */
(function(){
 "use strict";
 const base="https://bjendermisra-ops.github.io/iskcon-mob/";
 const endpoint=base+"__native_action__/";
 function action(name,params){
   if(location.protocol!=="https:"||location.hostname!=="bjendermisra-ops.github.io"||
      !location.pathname.startsWith("/iskcon-mob/"))return false;
   const url=endpoint+name+"?"+new URLSearchParams(params);
   // Invoke inside the actual tap handler, not via timers/automatic page load.
   location.assign(url);
   return true;
 }
 function safeText(s,max){return String(s||"").slice(0,max)}
 const api={
   shareText:function(text,url){
     text=safeText(text,1500);url=safeText(url||location.href,1900);
     if(!action("share-text",{text,url})&&navigator.share)navigator.share({text,url}).catch(()=>{});
   },
   shareImage:function(url,title){
     url=safeText(url,1900);title=safeText(title,100);
     if(!action("share-image",{url,title})&&navigator.share)
       navigator.share({url,title}).catch(()=>{});
   },
   saveImage:function(url,title){
     url=safeText(url,1900);title=safeText(title,100);
     if(!action("save-image",{url,title}))window.open(url,"_blank","noopener");
   }
 };
 window.TempleShare=Object.freeze(api);
})();
