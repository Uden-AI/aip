<script setup lang="ts">
import PrimaryContainer from "~/components/layout/PrimaryContainer.vue";
import { UISetting, UISettingType } from "~/types/types";
import { Setting } from "~/db/entities/Setting";
import { Page } from "db/entities/Page";

const user = (await useFetch("/api/user/get")).data.value;
const token = useCookie("token");
const loading = ref(false);

definePageMeta({
	middleware: "auth",
});

const receivedSettings =
	(await useFetch<Setting>("/api/admin/settings")).data.value?.value ?? {};

const pages: Page[] =
	(await useFetch("/api/page/pages")).data.value as any ?? [];

const getValue = (name: string) => {
	return receivedSettings[name];
};

const infoSettings: UISetting[] = [
	{
		name: "logo",
		type: UISettingType.Image,
		title: "Site logo",
		text: "Max: 2 MiB",
		value: getValue("logo"),
	},
	{
		name: "siteName",
		type: UISettingType.Text,
		title: "Site name",
		value: getValue("siteName"),
		text: "",
		icon: "ic:round-drive-file-rename-outline",
	},
	{
		name: "authorFirstName",
		type: UISettingType.Text,
		title: "Author First Name",
		value: getValue("authorFirstName"),
		text: "Your first name, which will be included near footers and on page metadata",
		icon: "ic:round-account-box",
	},
	{
		name: "authorLastName",
		type: UISettingType.Text,
		title: "Author Last Name",
		value: getValue("authorLastName"),
		text: "Your last name, which will be included near footers and on page metadata",
		icon: "ic:round-account-box",
	},
	{
		name: "authorAvatar",
		type: UISettingType.Image,
		title: "Author Avatar",
		text: "Max: 2 MiB",
		value: getValue("authorAvatar"),
	},
];

const brandSettings: UISetting[] = [
	{
		name: "brandName",
		type: UISettingType.Text,
		title: "Brand Name",
		value: getValue("brandName"),
		text: "Used in big logos next to your logo image",
		icon: "ic:round-account-balance",
	},
	{
		name: "organizationEnabled",
		type: UISettingType.Toggle,
		title: "Enable Organization",
		value: getValue("organizationEnabled"),
		text: "",
		icon: "ic:round-account-balance",
	},
	{
		name: "organizationName",
		type: UISettingType.Text,
		title: "Organization Name",
		text: "",
		value: getValue("organizationName"),
	},
	{
		name: "organizationLogo",
		type: UISettingType.Image,
		title: "Organization Logo",
		text: "",
		value: getValue("organizationLogo"),
	},
];

const navbarSettings: UISetting[] = [
	{
		name: "navbarItems",
		type: UISettingType.Navbar,
		title: "Navbar Items",
		text: "Navbar items",
		value: getValue("navbarItems"),
	},
];

const footerSettings: UISetting[] = [
	{
		name: "footerSocials",
		type: UISettingType.Footer,
		title: "Footer Socials",
		text: "Footer socials",
		value: getValue("footerSocials"),
	},
];

const categories = ref([
	{
		name: "Info",
		description:
			"Information about your website, like logos and description",
		settings: infoSettings,
	},
	{
		name: "Brand",
		description: "Brand settings: name, info, logo",
		settings: brandSettings,
	},
	{
		name: "Navbar",
		description: "Navbar settings",
		settings: navbarSettings,
	},
	{
		name: "Footer",
		description: "Footer settings",
		settings: footerSettings,
	},
]);

const saveSettings = async (newCategory: UISetting[], index: number) => {
	categories.value[index].settings = newCategory;
};

const sendChanges = () => {
	loading.value = true;

	useFetch("/api/admin/settings", {
		method: "PUT",
		headers: {
			Authorization: `Bearer ${token.value}`,
		},
		// Convert to big object with name: value instead
		// of lots of smaller objects with name/value attributes
		body: categories.value
			.map(cat => {
				return cat.settings
					.map(setting => ({
						[setting.name]: setting.value,
					}))
					.reduce((previous, current) => ({
						...previous,
						...current,
					}));
			})
			.reduce((previous, current) => ({
				...previous,
				...current,
			})),
	}).finally(() => {
		loading.value = false;
	});

}
</script>

<template>
	<PrimaryContainer class="mt-30">
		<form @submit.prevent="">
			<div class="space-y-12">
				<div
					v-for="(category, index) in categories"
					class="border-b border-gray-900/10 pb-12">
					<h2 class="text-xl font-bold leading-7 text-gray-900">
						{{ category.name }}
					</h2>
					<p class="mt-1 text-sm leading-6 text-gray-600">
						{{ category.description }}
					</p>

					<div class="mt-10 flex flex-col gap-8">
						<SettingsCategoryRenderer
							:pages="pages"
							:category="category.settings"
							:is-loading="loading"
							@update="
								newCategory => saveSettings(newCategory, index)
							" />
					</div>
				</div>
			</div>

			<div class="mt-6 flex items-center justify-end gap-x-2">
				<Button
					:loading="loading"
					@click="sendChanges"
					type="submit"
					theme="orange"
					class="w-full md:w-auto"
					>Save</Button
				>
			</div>
		</form>
	</PrimaryContainer>
</template>
