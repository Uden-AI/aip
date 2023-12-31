import { randomBytes } from "crypto";
import { Token } from "~/db/entities/Token";
import { User } from "~/db/entities/User";
import {
	getMisskeyAccessToken,
	getMisskeyAccount,
	getMastodonAccessToken,
	getMastodonAccount,
} from "~/utils/oauth";

export default defineEventHandler(async event => {
	const body: {
		provider: string;
		token: string;
		oauthData: {
			clientSecret: string;
			instanceUrl: string;
			redirectUri: string;
			clientId: string;
		};
	} = await readBody(event);

	if (!body.provider || !body.token || !body.oauthData)
		throw createError({
			statusCode: 400,
			statusMessage: "Missing fields: provider, oauthData and/or token",
		});

	let id = "";

	switch (body.provider) {
		case "misskey": {
			const misskeyToken = await getMisskeyAccessToken(
				body.token as string,
				body.oauthData
			);
			const account = await getMisskeyAccount(
				misskeyToken,
				body.oauthData
			);
			id = account.id;
			break;
		}
		case "mastodon": {
			const mastodonToken = await getMastodonAccessToken(
				body.token,
				body.oauthData
			);
			const account = await getMastodonAccount(
				mastodonToken,
				body.oauthData
			);

			id = account.id;
			break;
		}
	}

	const user = await User.createQueryBuilder("user")
		.where(
			`EXISTS(
						SELECT *
						FROM json_each(user.oauthAccounts)
						WHERE json_extract(value, '$.provider') = :provider
						AND json_extract(value, '$.id') = :userId
					)`,
			{ provider: body.provider, userId: id }
		)
		.getOne();

	if (!user)
		throw createError({
			statusCode: 401,
			statusMessage: "Incorrect username or password",
		});

	const token = new Token();

	token.user = user;
	token.token = randomBytes(128).toString("base64");
	token.expireDate = new Date(
		Date.now() +
			1000 /* sec */ * 60 /* min */ * 60 /* hour */ * 24 /* day */ * 7
	);

	await token.save();

	if (token) {
		return {
			token: token.token,
		};
	} else {
		throw createError({
			statusCode: 500,
		});
	}
});
