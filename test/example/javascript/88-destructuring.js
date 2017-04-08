"use strict";

//this is only a demo
function testme(address) {
    var interfaceId, pvid, cvid;
    [, interfaceId, pvid, cvid] = address.match(/(\d+):(\d+):(\d+)$/);
    return interfaceId + pvid + cvid;
}

testme("1:2:3");
