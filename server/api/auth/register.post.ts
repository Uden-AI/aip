import { randomBytes } from "crypto";
import DOMPurify from "isomorphic-dompurify";
import { SMTPClient } from "emailjs";
import { User } from "~/db/entities/User";
import { createPasswordHash, createSalt } from "~/utils/passwords";
import { getConfig } from "~/utils/config";
import { Token } from "~/db/entities/Token";
import { tempmailDomains } from "~/utils/tempmails";

function randomString(length: number, chars: string) {
	let result = "";
	for (let i = length; i > 0; --i)
		result += chars[Math.floor(Math.random() * chars.length)];
	return result;
}

export default defineEventHandler(async event => {
	const body = await readBody<{
		username: string;
		password: string;
		email: string;
	}>(event);

	const config = getConfig();

	const user = new User();

	if (!body.username.toLowerCase().match(/^[a-zA-Z0-9_]{3,20}$/)) {
		throw createError({
			statusCode: 400,
			message: "Invalid username",
		});
	}

	user.username = body.username.toLowerCase();

	// Check if mail is valid
	if (
		!body.email.match(
			/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
		)
	) {
		throw createError({
			statusCode: 400,
			message: "Invalid email",
		});
	}

	// Check if email is from known tempmail provider
	if (tempmailDomains.domains.includes(body.email.split("@")[1])) {
		throw createError({
			statusCode: 400,
			message: "Email provider is not allowed",
		});
	}

	// Check if mail already exists in database
	const foundUsers1 = await User.findBy({
		email: body.email,
	});

	if (foundUsers1.length > 0) {
		throw createError({
			statusCode: 400,
			message: "Email already exists",
		});
	}

	// Check if username already exists in database
	const foundUsers2 = await User.findBy({
		username: body.username,
	});

	if (foundUsers2.length > 0) {
		throw createError({
			statusCode: 400,
			message: "Username already exists",
		});
	}

	user.email = body.email;

	user.emailVerificationToken = randomString(
		8,
		"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	);

	user.password = await createPasswordHash(body.password, createSalt());
	user.display_name = DOMPurify.sanitize(user.username);

	// Free robux!!
	user.credits = 10_000;

	const client = new SMTPClient({
		user: config.smtp.user,
		password: config.smtp.password,
		host: config.smtp.host,
		port: 587,
		tls: true,
	});

	try {
		await client.sendAsync({
			text: `Your Uden AI verification code is: ${user.emailVerificationToken}`,
			from: `Uden AI <${config.smtp.user}>`,
			to: `${user.username} <${user.email}>`,
			subject: "Uden AI Email Verification",
		});
	} catch (e) {
		console.error(e);
		throw createError({
			statusCode: 500,
			message: "Failed to send verification email",
		});
	}

	const token = new Token();

	token.user = await user.save();
	token.token = randomBytes(128).toString("base64");
	token.expireDate = new Date(
		Date.now() +
			1000 /* sec */ * 60 /* min */ * 60 /* hour */ * 24 /* day */ * 7
	);

	await token.save();

	return {
		token: token.token,
	};
});
