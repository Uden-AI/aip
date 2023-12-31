<script setup lang="ts">
import { Client } from "~/packages/api";

const token = useCookie("token");
const loading = ref(false);
const isUploading = ref(false);

const client = new Client(token.value ?? "");
const personality = await client.getPersonality(
	(useRoute().params.id as string) ?? ""
);
if (!personality) {
	throw createError({
		statusCode: 404,
		message: "Personality not found",
	});
}

const name = ref(personality.name);
const description = ref(personality.description);
const prompt = ref(personality.prompt);
const avatar = ref(personality.avatar);

const isEdited = ref(false);

watch([name, description, prompt], () => {
	if (!isEdited.value) {
		isEdited.value = true;
	}
});

const save = () => {
	loading.value = true;

	client
		.updatePersonality(useRoute().params.id as string, {
			name: name.value,
			description: description.value,
			prompt: prompt.value,
			avatar: avatar.value,
		})
		.catch(err => {
			alert(`An error occured while saving: ${err}`);
		})
		.finally(() => {
			loading.value = false;
			isEdited.value = false;
		});
};

const uploadFile = (e: Event) => {
	const target = e.target as HTMLInputElement;

	if (!target.files?.length) return false;

	isUploading.value = true;

	client
		.uploadImage(target.files[0])
		.then(async res => {
			if (res.ok) {
				avatar.value = await res.text();
				save();
			}
		})
		.finally(() => {
			isUploading.value = false;
		});
};

const clickFileInput = () => {
	(
		document.querySelector(`input[name=avatar-input]`) as HTMLInputElement
	).click();
};

definePageMeta({
	middleware: "auth",
	layout: "account",
});
</script>

<template>
	<div
		class="bg-dark-400 !max-h-[100dvh] max-h-screen overflow-scroll no-scrollbar w-full h-screen overflow-y-scroll">
		<header
			class="flex items-center justify-center w-full bg-dark-600 h-40 overflow-hidden">
			<img
				class="object-cover w-full h-full"
				src="https://images.unsplash.com/photo-1444628838545-ac4016a5418a?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80" />
		</header>
		<div class="mx-auto max-w-4xl px-4">
			<div class="-mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5">
				<div class="flex">
					<div
						class="mt-2 ring-2 ring-dark-300 flex items-center justify-center gap-x-3 relative flex-none bg-gray-800 overflow-hidden group h-24 w-24 rounded sm:h-32 sm:w-32">
						<input
							accept="image/*"
							type="file"
							name="avatar-input"
							class="hidden"
							@change="uploadFile($event)" />
						<div
							class="absolute inset-0 bg-dark-100 bg-opacity-50 backdrop-blur-sm text-gray-800 group-hover:opacity-100 opacity-0 flex duration-200 items-center justify-center"
							@click="!isUploading && clickFileInput()">
							<Icon name="ic:round-upload" class="w-8 h-8" />
						</div>
						<div
							v-if="isUploading"
							class="absolute inset-0 bg-dark-100 text-gray-800 flex duration-200 items-center justify-center">
							<Spinner theme="gray" class="w-6 h-6" />
						</div>
						<img
							v-if="avatar"
							:src="avatar"
							class="h-full w-full object-cover"
							aria-hidden="true" />
						<Icon
							v-else
							name="ic:round-hide-image"
							class="text-gray-400 w-6 h-6" />
					</div>
				</div>
				<div
					class="mt-6 sm:flex sm:min-w-0 sm:flex-1 sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
					<div class="mt-6 min-w-0 flex-1 sm:hidden md:block">
						<h1 class="truncate text-2xl font-bold text-gray-50">
							{{ name }}
						</h1>
					</div>
					<div
						class="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
						<Button
							v-if="isEdited"
							theme="orange"
							:loading="loading"
							@click="save">
							<Icon name="tabler:device-floppy" class="mr-1" />
							Save
						</Button>
						<Button
							v-else
							theme="orangeDark"
							class="text-white"
							:loading="loading">
							<Icon name="tabler:messages" class="mr-1" />
							Chat
						</Button>
					</div>
				</div>
			</div>
			<div class="mt-6 hidden min-w-0 flex-1 sm:block md:hidden">
				<h1 class="truncate text-2xl font-bold text-gray-50">
					{{ name }}
				</h1>
			</div>

			<div class="mt-5">
				<label class="block text-sm font-medium leading-6 text-gray-200"
					>Name</label
				>
				<div class="mt-2">
					<InputCMInput
						:loading="loading"
						:value="name"
						name=""
						@input="name = ($event as any).target.value" />
				</div>
			</div>

			<div class="mt-4">
				<label class="block text-sm font-medium leading-6 text-gray-200"
					>What should the character's first message be?</label
				>
				<div class="mt-2">
					<InputCMInput
						:value="prompt"
						:loading="loading"
						name=""
						@input="prompt = ($event as any).target.value" />
				</div>
			</div>

			<div class="mt-4">
				<label class="block text-sm font-medium leading-6 text-gray-200"
					>How would the character describe themselves?</label
				>
				<div class="mt-2">
					<textarea
						v-model="description"
						:disabled="loading"
						rows="6"
						placeholder="A whimsical fairy named Timerly that lives in an enchanted forest. Its favourite activities are reading, writing books and collecting silly objects like broom handles or plungers."
						class="block w-full disabled:opacity-50 rounded-md bg-white/5 px-4 border-0 py-3 no-scrollbar text-gray-100 shadow-sm ring-1 ring-inset ring-dark-100 outline-none focus:outline-none placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-orange-500 duration-200 sm:text-sm sm:leading-6" />
				</div>
			</div>
		</div>
	</div>
</template>
