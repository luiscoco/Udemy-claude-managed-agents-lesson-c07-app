import { serveStudentAsset } from "./student-assets";
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { classify } from "./outcome";
if (existsSync(".env")) process.loadEnvFile(".env");
const port=Number(process.env.PORT||3007), key=process.env.ANTHROPIC_API_KEY||"", agent=process.env.CLAUDE_MANAGED_AGENT_ID||"", environment=process.env.CLAUDE_MANAGED_ENVIRONMENT_ID||"";
const configured=[key,agent,environment].every(v=>v&&!v.startsWith("your_"));
http.createServer(async(req,res)=>{
  res.setHeader("Cache-Control","no-store");
  try {
    if (await serveStudentAsset(req, res)) return;
    if(req.method==="GET"&&req.url==="/api/config"){res.writeHead(200,{"Content-Type":"application/json"});res.end(JSON.stringify({configured}));return;}
    if(req.method==="POST"&&req.url==="/api/run"){
      const origin=req.headers.origin;if(origin&&origin!==`http://127.0.0.1:${port}`&&origin!==`http://localhost:${port}`){res.writeHead(403).end();return;}
      let raw="";for await(const chunk of req){raw+=chunk;if(raw.length>10000)throw new Error("Request too large");}const body=JSON.parse(raw||"{}");
      if(typeof body.prompt!=="string"||!body.prompt.trim()||body.prompt.length>2000)throw new Error("Enter a prompt of up to 2,000 characters.");if(!configured)throw new Error("Configure the API key, agent and environment in .env.");
      res.writeHead(200,{"Content-Type":"application/x-ndjson; charset=utf-8"});const send=(type:string,value:unknown)=>{if(!res.destroyed)res.write(JSON.stringify({type,value})+"\n");};
      try {
        const client=new Anthropic({apiKey:key});const session=await client.beta.sessions.create({agent,environment_id:environment,budget:{type:"limit",max_list_cost:{amount:"50",currency:"USD"}}});send("session",session.id);
        const live=await client.beta.sessions.events.stream(session.id);res.on("close",()=>live.controller.abort());
        await client.beta.sessions.events.send(session.id,{events:[{type:"user.message",content:[{type:"text",text:body.prompt.trim()}]}]});
        let outcome="incomplete";
        for await(const event of live){send("event",event.type);if(event.type==="agent.message")for(const b of event.content)if(b.type==="text")send("answer",b.text);
          if(event.type==="session.status_idle"){outcome=classify("idle",event.stop_reason.type,false);send("reason",event.stop_reason.type);break;}
          if(event.type==="session.status_terminated"){outcome=classify("terminated",undefined,false);break;}
          if(event.type==="session.error"){outcome="error";send("error","Session reported an error.");break;}}
        send("outcome",outcome);
      }catch(error){send("error",error instanceof Error?error.message:"Request failed");}res.end();return;
    }
    const files:Record<string,string>={"/":"index.html","/style.css":"style.css","/app.js":"app.js","/astronaut.png":"astronaut.png"};if(req.method==="GET"&&req.url&&files[req.url]){const f=files[req.url],data=await readFile(path.join(__dirname,"..","public",f));res.writeHead(200,{"Content-Type":f.endsWith(".png")?"image/png":f.endsWith(".css")?"text/css":f.endsWith(".js")?"text/javascript":"text/html; charset=utf-8"});res.end(data);return;}
    res.writeHead(404).end("Not found");
  }catch(error){if(!res.headersSent)res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:error instanceof Error?error.message:"Request failed"}));}
}).listen(port,"127.0.0.1",()=>console.log(`Open http://127.0.0.1:${port}`));
