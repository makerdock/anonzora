import { Redis } from "ioredis";
import { FarcasterCast, FarcasterUser } from "@anonworld/common";

export class RedisService {
  private readonly client: Redis;
  private static instance: RedisService;

  private constructor(url: string) {
    this.client = new Redis(url);
  }

  static getInstance(): RedisService {
    if (!RedisService.instance) {
      const url = process.env.REDIS_URL ||
        "rediss://default:AcQ5AAIncDE1ZjAwYjA4YWUyM2I0YWFjOTFmY2JkMmIxODExMjBiYXAxNTAyMzM@romantic-unicorn-50233.upstash.io:6379";
      if (!url) {
        throw new Error("REDIS_URL environment variable is not set");
      }
      RedisService.instance = new RedisService(url);
    }
    return RedisService.instance;
  }

  async getLastEventId() {
    return this.client.get("last-event-id");
  }

  async setLastEventId(id: string) {
    return this.client.set("last-event-id", id);
  }

  async getPost(hash: string) {
    return this.client.get(`post:v2:${hash}`);
  }

  async setPost(hash: string, post: string) {
    return this.client.set(`post:v2:${hash}`, post, "EX", 60 * 5);
  }

  async getPosts(hashes: string[]) {
    return this.client.mget(hashes.map((hash) => `post:v2:${hash}`));
  }

  async setPosts(posts: FarcasterCast[]) {
    const args = posts.flatMap((post) => [
      `post:v2:${post.hash}`,
      JSON.stringify(post),
    ]);
    return this.client.mset(args);
  }

  async getCasts(hashes: string[]) {
    return this.client.mget(hashes.map((hash) => `cast:v2:${hash}`));
  }

  async setCasts(posts: FarcasterCast[]) {
    const args = posts.flatMap((post) => [
      `cast:v2:${post.hash}`,
      JSON.stringify(post),
    ]);
    return this.client.mset(args);
  }

  async getTrendingFeed(fid: number) {
    return this.client.get(`feed:trending:v2:${fid}`);
  }

  async setTrendingFeed(fid: number, feed: string) {
    return this.client.set(`feed:trending:v2:${fid}`, feed);
  }

  async getNewFeed(fid: number) {
    return this.client.get(`feed:new:v2:${fid}`);
  }

  async setNewFeed(fid: number, feed: string) {
    return this.client.set(`feed:new:v2:${fid}`, feed);
  }

  async actionOccurred(actionId: string, hash: string) {
    return this.client.exists(`action:${actionId}:${hash}`);
  }

  async markActionOccurred(actionId: string, hash: string) {
    await this.client.set(`action:${actionId}:${hash}`, "true", "EX", 60 * 5);
  }

  async getStorageSlot(chainId: number, address: string, key: string) {
    return this.client.get(`storage-slot:${chainId}:${address}:${key}`);
  }

  async setStorageSlot(
    chainId: number,
    address: string,
    key: string,
    value: string
  ) {
    return this.client.set(`storage-slot:${chainId}:${address}:${key}`, value);
  }

  async getToken(chainId: number, tokenAddress: string) {
    return this.client.get(`token:${chainId}:${tokenAddress.toLowerCase()}`);
  }

  async setToken(chainId: number, tokenAddress: string, token: string) {
    return this.client.set(
      `token:${chainId}:${tokenAddress.toLowerCase()}`,
      token,
      "EX",
      60 * 60 * 24
    );
  }

  async getNFTCollection(chainId: number, tokenAddress: string) {
    return this.client.get(
      `nft-collection:${chainId}:${tokenAddress.toLowerCase()}`
    );
  }

  async setNFTCollection(
    chainId: number,
    tokenAddress: string,
    collection: string
  ) {
    return this.client.set(
      `nft-collection:${chainId}:${tokenAddress.toLowerCase()}`,
      collection,
      "EX",
      60 * 60 * 24
    );
  }

  async getVaultChallenge(nonce: string): Promise<string | null> {
    return this.client.get(`vault:challenge:${nonce}`);
  }

  async setVaultChallenge(nonce: string, challenge: string) {
    return this.client.set(`vault:challenge:${nonce}`, challenge, "EX", 60 * 5);
  }

  async getLeaderboard(timeframe: string) {
    return this.client.get(`leaderboard:${timeframe}`);
  }

  async setLeaderboard(timeframe: string, leaderboard: string) {
    return this.client.set(`leaderboard:${timeframe}`, leaderboard);
  }

  async getCredentialPostsFeed(credentialId: string) {
    return this.client.get(`credential:posts:feed:${credentialId}`);
  }

  async setCredentialPostsFeed(credentialId: string, feed: string) {
    return this.client.set(
      `credential:posts:feed:${credentialId}`,
      feed,
      "EX",
      60 * 5
    );
  }

  async getVaultPostsFeed(vaultId: string) {
    return this.client.get(`vault:posts:feed:${vaultId}`);
  }

  async setVaultPostsFeed(vaultId: string, feed: string) {
    return this.client.set(`vault:posts:feed:${vaultId}`, feed, "EX", 60 * 5);
  }

  async getFarcasterUsers(fids: number[]) {
    return this.client.mget(fids.map((fid) => `farcaster:user:${fid}`));
  }

  async setFarcasterUsers(users: FarcasterUser[]) {
    const pipeline = this.client.pipeline();

    users.forEach((user) => {
      pipeline.set(
        `farcaster:user:${user.fid}`,
        JSON.stringify(user),
        "EX",
        60 * 60
      );
    });

    return pipeline.exec();
  }
}

export const redis = RedisService.getInstance();
