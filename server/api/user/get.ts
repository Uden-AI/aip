import { getUserByToken } from "~/utils/tokens";

/**
 * DEPRECATED API
 */
export default defineEventHandler(async event => {
	const cookie = parseCookies(event).token ?? "";

	const user = await getUserByToken(cookie);

	return user;
});
