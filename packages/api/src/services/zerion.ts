import { zeroAddress } from "viem";
import {
  FungiblePosition,
  Fungible,
  ZerionResponse,
  chains,
  NFTPosition,
} from "@anonworld/common";

const zerionChains = chains.map((chain) => chain.zerionId).filter((id) => id);

class ZerionService {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.zerion.io/v1";
  private static instance: ZerionService;

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static getInstance(): ZerionService {
    if (!ZerionService.instance) {
      const apiKey = "zk_dev_21125a629c814f65b56f6e50e4acd48d";
      if (!apiKey) {
        throw new Error("ZERION_API_KEY environment variable is not set");
      }
      ZerionService.instance = new ZerionService(apiKey);
    }
    return ZerionService.instance;
  }

  private async makeRequest<T>(
    endpoint: string,
    options?: {
      maxRetries?: number;
      retryDelay?: number;
    }
  ): Promise<ZerionResponse<T>> {
    const { maxRetries = 1, retryDelay = 10000 } = options ?? {};
    let retries = 0;

    while (retries < maxRetries) {
      const headers: Record<string, string> = {
        accept: "application/json",
        authorization: `Basic ${this.apiKey}`,
      };
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers,
      });

      if (response.status === 202 && maxRetries > 1) {
        retries++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay));
        continue;
      }

      if (!response.ok) {
        console.error(`Zerion API error: ${response.status} ${response.statusText}`)
        if (response.status === 401) {
          console.error('Zerion API key may be expired or invalid')
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    }

    throw new Error("Maximum retries reached while waiting for data");
  }

  async getFungiblePositions(address: string): Promise<FungiblePosition[]> {
    const response = await this.makeRequest<FungiblePosition[]>(
      `/wallets/${address}/positions?filter[chain_ids]=${zerionChains.join(
        ","
      )}`
    );
    return response.data;
  }

  async getFungible(chainId: number, tokenAddress: string): Promise<Fungible> {
    const query = new URLSearchParams();
    query.set("filter[implementation_chain_id]", chainId.toString());
    if (tokenAddress !== zeroAddress) {
      query.set("filter[implementation_address]", tokenAddress);
    } else {
      query.set("filter[fungible_ids]", "eth");
    }
    const response = await this.makeRequest<Fungible[]>(
      `/fungibles?${query.toString()}`
    );
    return response.data[0];
  }

  async getNFTPositions(address: string): Promise<NFTPosition[]> {
    const response = await this.makeRequest<NFTPosition[]>(
      `/wallets/${address}/nft-positions?filter[chain_ids]=${zerionChains.join(
        ","
      )}`
    );
    return response.data;
  }
}

export const zerion = ZerionService.getInstance();
