import "reflect-metadata";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { buildSchema } from "type-graphql";
import cors from "cors";
import { json } from "body-parser";
import { AppDataSource } from "./config/data-source";
import { EventResolver } from "./resolvers/EventResolver";

const main = async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("Database Connected!");
    }
  } catch (err) {
    console.error("Database Error", err);
  }

  const schema = await buildSchema({
    resolvers: [EventResolver],
    validate: false,
  });

  const app = express();

  const server = new ApolloServer({
    schema,
    introspection: true,
  });

  await server.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(server)
  );

  app.listen(4000, () => {
    console.log("Server started on http://localhost:4000/graphql");
  });
};

main();