import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter()

http.route({
     path: '/clerk-webhook',
     method: 'POST',
     handler: httpAction(async (ctx, request) => {
          const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
          if (!webhookSecret) {
               throw new Error("Webhook secret not set");
          }

          const svix_id = request.headers.get("svix-id");
          const svix_signature = request.headers.get("svix-signature");
          const svix_timestamp = request.headers.get("svix-timestamp");

          if (!svix_id || !svix_signature || !svix_timestamp) {
               return new Response("Missing headers", { status: 400 });    
          }

          const payload = await request.json();
          const body = JSON.stringify(payload);

          const wh = new Webhook(webhookSecret);
          let event: WebhookEvent;

          try{
               event = wh.verify(body, {
                    "svix-id": svix_id,
                    "svix-signature": svix_signature,
                    "svix-timestamp": svix_timestamp,
               }) as WebhookEvent;
          } catch (error) {
               console.error("Error verifying webhook:", error);
               return new Response("Invalid signature", { status: 403 });
          }

          const eventType = event.type;

          if(eventType === "user.created"){
               const {id, first_name, last_name, image_url, email_addresses} = event.data;

               const email = email_addresses[0].email_address;

               const name = `${first_name || ""} ${last_name || ""}`.trim();

               try {
                    await  ctx.runMutation(api.users.syncUser, {
                         email,
                         name,
                         image: image_url,
                         clerkId: id,
                    })
               } catch (error) {
                    console.log("Error syncing user:", error);
                    return new Response("Error syncing user", { status: 500 });
               }
          }

          return new Response("Webhook Processed successfully", { status: 200 });
     })
})

export default http;