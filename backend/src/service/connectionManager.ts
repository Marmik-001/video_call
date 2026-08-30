// this file should have switch case managing, state and connection, connection array(map) and stuff

import type { CustomWebSocket } from "../types/websocket.types.js";


class ConnectionManager {
  private connections: Map<string, CustomWebSocket> = new Map();

  public add(username: string, ws: CustomWebSocket): void {
    this.connections.set(username, ws);
  }
  public get(username: string): CustomWebSocket | undefined {
    return this.connections.get(username)
  }
  public remove(username: string): void {
    this.connections.delete(username)
  }
  public has(username: string): boolean {
    return this.connections.has(username)
  }
  public getAllUsernames(): string[] {
    return Array.from(this.connections.keys());
  }
  public getAllWebsockets(): CustomWebSocket[] {
    return Array.from(this.connections.values());
  }
}

export const ConnectionManagerInstance = new ConnectionManager();


