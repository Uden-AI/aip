<script setup lang="ts">
import { UserManager } from "oidc-client-ts";
import { Config } from "~/types/config";
import { signInWithMastodon } from "~/utils/oauth";

const token = useCookie("token", {
	sameSite: "strict",
	secure: true,
});

const showingPassword = ref(false);

const loading = ref(false);
const route = useRoute();
const error = ref<{
	message: string;
	statusCode: number;
} | null>(null);

const submit = async (e: Event) => {
	loading.value = true;
	const username: string = (e.target as any).username.value;
	const password: string = (e.target as any).password.value;

	const response = await fetch("/api/auth/login", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			username,
			password,
		}),
	});

	if (response.ok) {
		token.value = (await response.json()).token;

		if (new URLSearchParams(window.location.search).get("next")) {
			window.location.href =
				new URLSearchParams(window.location.search)
					.get("next")
					?.toString() ?? "";
		} else {
			window.location.href = "/";
		}
	} else {
		error.value = await response.json();
	}

	loading.value = false;
};

definePageMeta({
	smallNavbar: true,
});

onMounted(() => {
	if (route.query.code) {
		// Initiate sign in with Mastodon
		loading.value = true;

		fetch("/api/auth/login-oauth", {
			method: "POST",
			body: JSON.stringify({
				provider: "mastodons",
				token: route.query.code,
				oauthData: JSON.parse(
					localStorage.getItem("oauth_mastodon_client") ?? "{}"
				),
			}),
		}).then(async response => {
			if (response.ok) {
				token.value = (await response.json()).token;

				if (new URLSearchParams(window.location.search).get("next")) {
					useRouter().push(
						new URLSearchParams(window.location.search)
							.get("next")
							?.toString() ?? ""
					);
				} else {
					useRouter().push("/");
				}
			} else {
				error.value = await response.json();
				loading.value = false;
			}
		});
	}

	loading.value = false;
});

const oidc = (await useFetch("/api/config/oidc")).data;

const oidcSignIn = async (oidcProvider: Config["oidc_providers"][0]) => {
	loading.value = true;
	const userManager = new UserManager({
		authority: oidcProvider.authority,
		client_id: oidcProvider.client_id,
		redirect_uri: `${useRequestURL().origin}/auth/callback/${
			oidcProvider.id
		}/`,
		scope: oidcProvider.scopes.join(" "),
	});

	const user = await userManager.signinPopup();

	const response = await fetch("/api/auth/login-openid", {
		method: "POST",
		body: JSON.stringify({
			body: user,
			provider: oidcProvider.id,
		}),
	});

	if (response.ok) {
		token.value = (await response.json()).token;

		window.location.href = "/";
	} else {
		error.value = await response.json();
	}

	loading.value = false;
};

useHead({
	title: "Login · AIP",
});
</script>

<template>
	<div
		class="flex min-h-full flex-1 flex-col dark justify-center px-6 py-12 lg:px-8 bg-dark-600">
		<div class="sm:mx-auto sm:w-full sm:max-w-sm">
			<LogosSmallLogo class="!w-10 !h-10 mx-auto" />
			<h2
				class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-50">
				Sign in to your account
			</h2>
		</div>

		<div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
			<form
				class="space-y-6"
				action="#"
				method="POST"
				@submit.prevent="submit">
				<div>
					<label
						for="email"
						class="block text-sm font-medium leading-6 text-gray-50"
						>Username</label
					>
					<div class="mt-2">
						<InputCMInput
							icon="ic:round-perm-identity"
							name="username"
							placeholder="Your username"
							autocomplete="username"
							required
							class="block w-full rounded-md"
							:loading="loading" />
					</div>
				</div>

				<div>
					<div class="flex items-center justify-between">
						<label
							for="password"
							class="block text-sm font-medium leading-6 text-gray-50"
							>Password</label
						>
						<div class="text-sm">
							<a
								href="#"
								class="font-semibold text-orange-600 hover:text-orange-500"
								@click="showingPassword = !showingPassword"
								>{{ showingPassword ? "Hide" : "Show" }}</a
							>
						</div>
					</div>
					<div class="mt-2">
						<InputCMInput
							name="password"
							:type="showingPassword ? 'text' : 'password'"
							icon="ic:round-password"
							autocomplete="current-password"
							placeholder="Your password"
							required
							:loading="loading"
							class="block w-full rounded-md" />
					</div>
				</div>

				<div
					v-if="error"
					class="rounded bg-red-200 ring-1 ring-red-600 p-4 text-sm flex flex-col gap-2">
					<strong class="font-semibold text-gray-900"
						>An error occured</strong
					>
					<span class="text-gray-700">{{ error.message }}</span>
				</div>

				<div>
					<Button
						:loading="loading"
						type="submit"
						theme="orange"
						class="flex w-full">
						Sign in
					</Button>
				</div>
				<div
					class="relative flex flex-row justify-center items-center text-sm">
					<div class="h-0.5 bg-gray-800 w-1/4 rounded"></div>
					<span class="px-2 text-gray-400 w-1/2 text-center">
						Or continue with
					</span>
					<div class="h-0.5 bg-gray-800 w-1/4 rounded"></div>
				</div>
				<div class="grid grid-cols-2 w-full gap-2">
					<Button
						:loading="loading"
						theme="gray"
						class="w-full"
						@click="
							() => {
								loading = true;
								signInWithMastodon();
							}
						">
						<Icon name="logos:mastodon-icon" class="mr-2 w-4 h-4" />
						Mastodon
					</Button>
					<Button
						v-for="provider of oidc"
						:key="provider.id"
						:loading="loading"
						theme="gray"
						class="w-full"
						@click="oidcSignIn(provider)">
						<img :src="provider.icon" class="mr-2 w-4 h-4" />
						{{ provider.name }}
					</Button>
				</div>
			</form>
		</div>
	</div>
</template>
