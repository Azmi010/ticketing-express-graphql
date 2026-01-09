import "reflect-metadata";
import express from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildSchema } from "type-graphql";
import cors from "cors";
import { json } from "body-parser";
import { AppDataSource } from "./config/data-source";
import { EventResolver } from "./resolvers/EventResolver";
import { AuthResolver } from "./resolvers/AuthResolver";
import { MyContext } from "./utils/MyContext";
import { TicketResolver } from "./resolvers/TicketResolver";
import { OrderResolver } from "./resolvers/OrderResolver";
import { pubsub } from "./config/pubsub";

const main = async () => {
  try {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database Connected!");
    }

    // Build GraphQL schema
    const schema = await buildSchema({
      resolvers: [EventResolver, AuthResolver, TicketResolver, OrderResolver],
      validate: false,
      pubSub: pubsub as any,
    });

    const app = express();
    const httpServer = createServer(app);

    // Create WebSocket server
    const wsServer = new WebSocketServer({
      server: httpServer,
      path: "/graphql",
    });

    // Setup graphql-ws
    const serverCleanup = useServer(
      {
        schema,
        context: async (ctx) => {
          return {
            connectionParams: ctx.connectionParams,
          };
        },
      },
      wsServer
    );

    const server = new ApolloServer({
      schema,
      introspection: true,
      plugins: [
        ApolloServerPluginDrainHttpServer({ httpServer }),
        {
          async serverWillStart() {
            return {
              async drainServer() {
                await serverCleanup.dispose();
              },
            };
          },
        },
      ],
    });

    await server.start();

    app.use(
      "/graphql",
      cors<cors.CorsRequest>(),
      json(),
      expressMiddleware(server, {
        context: async ({ req, res }): Promise<MyContext> => ({ req, res }),
      })
    );

    const PORT = 4000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server started on http://localhost:${PORT}/graphql`);
      console.log(`🔌 WebSocket ready at ws://localhost:${PORT}/graphql`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
};

main();
