#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadAiAssetConfig } from "./config.js";
import { createAiAssetMcpServer } from "./server.js";

const server = createAiAssetMcpServer(loadAiAssetConfig());
await server.connect(new StdioServerTransport());
