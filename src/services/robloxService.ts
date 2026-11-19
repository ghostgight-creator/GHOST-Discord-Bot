export interface RobloxUserProfile {
  id: number;
  name: string;
  displayName: string;
  description: string;
  created: string;
  isBanned: boolean;
  externalAppDisplayName?: string | null;
  hasVerifiedBadge?: boolean;
}

export interface RobloxUserCounts {
  friends: number | string;
  followers: number | string;
  following: number | string;
}

export interface RobloxGroupRole {
  group: {
    id: number;
    name: string;
    memberCount?: number;
    hasVerifiedBadge?: boolean;
  };
  role: {
    id: number;
    name: string;
    rank: number;
  };
}

export interface RobloxGameData {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string;
  creator: {
    id: number;
    name: string;
    type: string;
    hasVerifiedBadge?: boolean;
  };
  price: number | null;
  playing: number;
  visits: number;
  maxPlayers: number;
  created: string;
  updated: string;
  iconUrl?: string | null;
}

export interface RobloxGroupData {
  id: number;
  name: string;
  description: string;
  owner: {
    id: number;
    username: string;
    displayName: string;
  } | null;
  memberCount: number;
  isPublic: boolean;
  hasVerifiedBadge?: boolean;
  iconUrl?: string | null;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class RobloxService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 3 * 60 * 1000; // 3 minutes cache

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttl });
  }

  private async safeFetch(url: string, options?: RequestInit): Promise<{ ok: boolean; status: number; data?: any; error?: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GHOST-Discord-Bot/1.0',
          ...(options?.headers || {})
        }
      });
      clearTimeout(timeoutId);

      if (response.status === 404) {
        return { ok: false, status: 404, error: 'NOT_FOUND' };
      }
      if (response.status === 429) {
        return { ok: false, status: 429, error: 'RATE_LIMITED' };
      }
      if (!response.ok) {
        return { ok: false, status: response.status, error: `HTTP_${response.status}` };
      }

      const json = await response.json();
      return { ok: true, status: response.status, data: json };
    } catch (err: any) {
      return { ok: false, status: 0, error: err.name === 'AbortError' ? 'TIMEOUT' : (err.message || 'NETWORK_ERROR') };
    }
  }

  public extractUserIdFromInput(input: string): number | null {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    const match = trimmed.match(/roblox\.com\/(?:[a-z]{2}-[a-z]{2}\/)?users\/(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  public extractPlaceIdFromInput(input: string): number | null {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    const match = trimmed.match(/roblox\.com\/games\/(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  public extractGroupIdFromInput(input: string): number | null {
    const trimmed = input.trim();
    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    const match = trimmed.match(/roblox\.com\/groups\/(\d+)/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    return null;
  }

  // 1. Resolve User (by username or link/ID)
  public async resolveUser(query: string): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'API_UNAVAILABLE' | 'INVALID_INPUT';
    user?: { id: number; name: string; displayName: string };
  }> {
    const directId = this.extractUserIdFromInput(query);
    if (directId) {
      const details = await this.getUserDetails(directId);
      if (details.success && details.data) {
        return {
          success: true,
          user: {
            id: details.data.id,
            name: details.data.name,
            displayName: details.data.displayName
          }
        };
      }
      return {
        success: false,
        reason: details.reason === 'NOT_FOUND' ? 'NOT_FOUND' : 'API_UNAVAILABLE'
      };
    }

    const cleanUsername = query.trim().replace(/^@/, '');
    if (!cleanUsername) return { success: false, reason: 'INVALID_INPUT' };

    const cacheKey = `user_resolve_${cleanUsername.toLowerCase()}`;
    const cached = this.getFromCache<{ id: number; name: string; displayName: string }>(cacheKey);
    if (cached) return { success: true, user: cached };

    const res = await this.safeFetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        usernames: [cleanUsername],
        excludeBannedUsers: false
      })
    });

    if (!res.ok) {
      return { success: false, reason: 'API_UNAVAILABLE' };
    }

    const data = res.data?.data;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { success: false, reason: 'NOT_FOUND' };
    }

    const user = {
      id: data[0].id,
      name: data[0].name,
      displayName: data[0].displayName
    };

    this.setCache(cacheKey, user);
    return { success: true, user };
  }

  // 2. Get User Full Profile Details
  public async getUserDetails(userId: number): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'API_UNAVAILABLE';
    data?: RobloxUserProfile;
  }> {
    const cacheKey = `user_details_${userId}`;
    const cached = this.getFromCache<RobloxUserProfile>(cacheKey);
    if (cached) return { success: true, data: cached };

    const res = await this.safeFetch(`https://users.roblox.com/v1/users/${userId}`);
    if (!res.ok) {
      return {
        success: false,
        reason: res.status === 404 ? 'NOT_FOUND' : 'API_UNAVAILABLE'
      };
    }

    const userProfile: RobloxUserProfile = res.data;
    this.setCache(cacheKey, userProfile);
    return { success: true, data: userProfile };
  }

  // 3. Get User Avatar Thumbnails
  public async getUserThumbnails(userId: number): Promise<{
    headshot: string | null;
    fullBody: string | null;
  }> {
    const cacheKey = `user_thumbs_${userId}`;
    const cached = this.getFromCache<{ headshot: string | null; fullBody: string | null }>(cacheKey);
    if (cached) return cached;

    const [headshotRes, fullBodyRes] = await Promise.all([
      this.safeFetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=false`),
      this.safeFetch(`https://thumbnails.roblox.com/v1/users/avatar?userIds=${userId}&size=420x420&format=Png&isCircular=false`)
    ]);

    const headshot = headshotRes.ok && headshotRes.data?.data?.[0]?.imageUrl ? headshotRes.data.data[0].imageUrl : null;
    const fullBody = fullBodyRes.ok && fullBodyRes.data?.data?.[0]?.imageUrl ? fullBodyRes.data.data[0].imageUrl : null;

    const result = { headshot, fullBody };
    this.setCache(cacheKey, result);
    return result;
  }

  // 4. Get User Counts (Friends, Followers, Following)
  public async getUserCounts(userId: number): Promise<RobloxUserCounts> {
    const cacheKey = `user_counts_${userId}`;
    const cached = this.getFromCache<RobloxUserCounts>(cacheKey);
    if (cached) return cached;

    const [friendsRes, followersRes, followingRes] = await Promise.allSettled([
      this.safeFetch(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
      this.safeFetch(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
      this.safeFetch(`https://friends.roblox.com/v1/users/${userId}/followings/count`)
    ]);

    const parseCount = (res: PromiseSettledResult<any>, field: string = 'count'): number | string => {
      if (res.status === 'fulfilled' && res.value.ok && typeof res.value.data?.[field] === 'number') {
        return res.value.data[field];
      }
      return 'N/A';
    };

    const counts: RobloxUserCounts = {
      friends: parseCount(friendsRes),
      followers: parseCount(followersRes),
      following: parseCount(followingRes)
    };

    this.setCache(cacheKey, counts);
    return counts;
  }

  // 5. Get User Groups
  public async getUserGroups(userId: number): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'API_UNAVAILABLE';
    groups: RobloxGroupRole[];
  }> {
    const cacheKey = `user_groups_${userId}`;
    const cached = this.getFromCache<RobloxGroupRole[]>(cacheKey);
    if (cached) return { success: true, groups: cached };

    const res = await this.safeFetch(`https://groups.roblox.com/v2/users/${userId}/groups/roles`);
    if (!res.ok) {
      return { success: false, reason: 'API_UNAVAILABLE', groups: [] };
    }

    const list: RobloxGroupRole[] = res.data?.data || [];
    this.setCache(cacheKey, list);
    return { success: true, groups: list };
  }

  // 6. Get Game Data
  public async getGameData(input: string): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'API_UNAVAILABLE' | 'INVALID_INPUT';
    game?: RobloxGameData;
  }> {
    const placeId = this.extractPlaceIdFromInput(input);
    if (!placeId) return { success: false, reason: 'INVALID_INPUT' };

    const cacheKey = `game_${placeId}`;
    const cached = this.getFromCache<RobloxGameData>(cacheKey);
    if (cached) return { success: true, game: cached };

    // Resolve Universe ID
    const universeRes = await this.safeFetch(`https://apis.roblox.com/universes/v1/places/${placeId}/universe`);
    if (!universeRes.ok || !universeRes.data?.universeId) {
      return { success: false, reason: universeRes.status === 404 ? 'NOT_FOUND' : 'API_UNAVAILABLE' };
    }
    const universeId = universeRes.data.universeId;

    // Fetch Game Details & Icon
    const [detailsRes, iconRes] = await Promise.all([
      this.safeFetch(`https://games.roblox.com/v1/games?universeIds=${universeId}`),
      this.safeFetch(`https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=512x512&format=Png`)
    ]);

    if (!detailsRes.ok || !detailsRes.data?.data?.[0]) {
      return { success: false, reason: 'API_UNAVAILABLE' };
    }

    const rawGame = detailsRes.data.data[0];
    const iconUrl = iconRes.ok && iconRes.data?.data?.[0]?.imageUrl ? iconRes.data.data[0].imageUrl : null;

    const game: RobloxGameData = {
      id: rawGame.id,
      rootPlaceId: rawGame.rootPlaceId || placeId,
      name: rawGame.name,
      description: rawGame.description || '',
      creator: rawGame.creator,
      price: rawGame.price,
      playing: rawGame.playing || 0,
      visits: rawGame.visits || 0,
      maxPlayers: rawGame.maxPlayers || 0,
      created: rawGame.created,
      updated: rawGame.updated,
      iconUrl
    };

    this.setCache(cacheKey, game);
    return { success: true, game };
  }

  // 7. Get Group Data
  public async getGroupData(input: string): Promise<{
    success: boolean;
    reason?: 'NOT_FOUND' | 'API_UNAVAILABLE' | 'INVALID_INPUT';
    group?: RobloxGroupData;
  }> {
    const groupId = this.extractGroupIdFromInput(input);
    if (!groupId) return { success: false, reason: 'INVALID_INPUT' };

    const cacheKey = `group_${groupId}`;
    const cached = this.getFromCache<RobloxGroupData>(cacheKey);
    if (cached) return { success: true, group: cached };

    const [groupRes, iconRes] = await Promise.all([
      this.safeFetch(`https://groups.roblox.com/v1/groups/${groupId}`),
      this.safeFetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png`)
    ]);

    if (!groupRes.ok) {
      return { success: false, reason: groupRes.status === 404 ? 'NOT_FOUND' : 'API_UNAVAILABLE' };
    }

    const rawGroup = groupRes.data;
    const iconUrl = iconRes.ok && iconRes.data?.data?.[0]?.imageUrl ? iconRes.data.data[0].imageUrl : null;

    const group: RobloxGroupData = {
      id: rawGroup.id,
      name: rawGroup.name,
      description: rawGroup.description || '',
      owner: rawGroup.owner,
      memberCount: rawGroup.memberCount || 0,
      isPublic: rawGroup.isPublic ?? true,
      hasVerifiedBadge: rawGroup.hasVerifiedBadge,
      iconUrl
    };

    this.setCache(cacheKey, group);
    return { success: true, group };
  }

  // Helper: Format Account Age
  public calculateAccountAge(createdDateString: string, lang: 'ar' | 'en' = 'ar'): string {
    const created = new Date(createdDateString);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = Math.floor((diffDays % 365) % 30);

    if (lang === 'ar') {
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} سنة`);
      if (months > 0) parts.push(`${months} شهر`);
      if (days > 0 || parts.length === 0) parts.push(`${days} يوم`);
      return parts.join(' و ');
    } else {
      const parts: string[] = [];
      if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`);
      if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`);
      if (days > 0 || parts.length === 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
      return parts.join(', ');
    }
  }
}

export const robloxService = new RobloxService();
