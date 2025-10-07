import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

// Base API URL for FreeTable
const FREETABLE_API_BASE = "https://free-table.gyurmatag.workers.dev";

// Define our MCP agent with tools
export class MyMCP extends McpAgent {
	server = new McpServer({
		name: "FreeTable Restaurant Booking",
		version: "1.0.0",
	});

	async init() {
		// Restaurant listing tool for FreeTable API
		this.server.tool(
			"get_restaurants",
			{},
			async () => {
				try {
					const response = await fetch(`${FREETABLE_API_BASE}/api/restaurants`);
					
					if (!response.ok) {
						return {
							content: [
								{
									type: "text",
									text: `Error fetching restaurants: ${response.status} ${response.statusText}`,
								},
							],
						};
					}

					const data = await response.json() as { restaurants?: any[] };
					const restaurants = data.restaurants || [];

					// Format restaurants for better readability
					const formattedRestaurants = restaurants.map((restaurant: any) => ({
						id: restaurant.id,
						name: restaurant.name,
						description: restaurant.description,
						cuisine: restaurant.cuisine,
						priceRange: restaurant.priceRange,
						address: restaurant.address,
						phone: restaurant.phone,
						email: restaurant.email,
					}));

					return {
						content: [
							{
								type: "text",
								text: `Found ${restaurants.length} restaurants:\n\n${formattedRestaurants
									.map(
										(r: any) =>
											`🍽️ **${r.name}** (${r.cuisine})\n   ${r.description}\n   Price: ${r.priceRange}\n   📍 ${r.address}\n   📞 ${r.phone}\n`
									)
									.join("\n")}`,
							},
						],
					};
				} catch (error) {
					return {
						content: [
							{
								type: "text",
								text: `Error fetching restaurants: ${error instanceof Error ? error.message : "Unknown error"}`,
							},
						],
					};
				}
			},
		);
	}
}

export default {
	fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const url = new URL(request.url);

		if (url.pathname === "/sse" || url.pathname === "/sse/message") {
			return MyMCP.serveSSE("/sse").fetch(request, env, ctx);
		}

		if (url.pathname === "/mcp") {
			return MyMCP.serve("/mcp").fetch(request, env, ctx);
		}

		return new Response("Not found", { status: 404 });
	},
};
