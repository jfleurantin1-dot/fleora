import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList } from "node:net";

const blocked = new BlockList();
for (const [ip, prefix] of [["0.0.0.0",8],["10.0.0.0",8],["100.64.0.0",10],["127.0.0.0",8],["169.254.0.0",16],["172.16.0.0",12],["192.0.0.0",24],["192.0.2.0",24],["192.168.0.0",16],["198.18.0.0",15],["198.51.100.0",24],["203.0.113.0",24],["224.0.0.0",4],["240.0.0.0",4]] as [string,number][]) blocked.addSubnet(ip,prefix);

// Resolve and pin the public IPv4 address for every hop; never follow a redirect unchecked.
export async function fetchProductPage(raw: string, signal: AbortSignal, hops = 0): Promise<{html: string; url: string}> {
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || hops > 3) throw new Error("Unsupported link");
  const { address } = await lookup(url.hostname, {family:4});
  if (blocked.check(address)) throw new Error("Unsupported address");
  const result = await new Promise<{html?:string; redirect?:string}>((resolve, reject) => {
    const req = request(url, {signal, family:4, headers:{"User-Agent":"Fleora-LinkPreview/1.0", Accept:"text/html", "Accept-Encoding":"identity"}, lookup: (_host, _opts, cb) => cb(null, address, 4)}, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) { res.resume(); resolve({redirect:res.headers.location}); return; }
      if (res.statusCode !== 200 || !res.headers["content-type"]?.includes("text/html")) {res.destroy();reject(new Error("Store unavailable"));return;}
      let size=0; const chunks:Buffer[]=[];
      res.on("data", (chunk:Buffer) => {size+=chunk.length;if(size>2_000_000){res.destroy();reject(new Error("Page too large"));}else chunks.push(chunk);});
      res.on("end",()=>resolve({html:Buffer.concat(chunks).toString("utf8")}));
      res.on("error",reject);
    });
    req.on("error",reject);req.end();
  });
  if (result.redirect) return fetchProductPage(new URL(result.redirect,url).href,signal,hops+1);
  return {html:result.html || "",url:url.href};
}
