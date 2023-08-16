<script setup lang="ts">
import { Chat } from "~/db/entities/Chat";
import { User } from "~/db/entities/User";

defineProps<{
	user: User;
}>()

const token = useCookie("token");

const chats = await useFetch("/api/chats/", {
	headers: {
		"Content-Type": "application/json",
		Authorization: `Bearer ${token.value}`,
	},
});

const chatsList = ref(chats.data.value as Chat[]);

const deleteChat = (e: Event, id: number) => {
	e.stopPropagation();
	e.preventDefault();
	if (confirm("Are you sure you want to delete this chat?")) {
		fetch(`/api/chats/${id}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token.value}`,
			},
		})
			.then(res => {
				if (res.ok) {
					chatsList.value = chatsList.value.filter((c) => c.id !== id);

					// If on the deleted chat URL, navigate to the latest chat
					if (window.location.pathname === `/chats/${id}`) {
						const latestChat = chatsList.value[0];
						if (latestChat) {
							useRouter().push(`/chats/${latestChat.id}`);
						} else {
							useRouter().push("/chats");
						}
					}
				}
			});
	}
}
</script>

<template>
	<div
		class="dark flex-shrink-0 overflow-x-hidden bg-dark-800 font-['Inter'] md:block hidden"
		style="width: 260px">
		<div class="h-full w-[260px]">
			<div class="flex h-full min-h-0 flex-col">
				<div
					class="scrollbar-trigger relative h-full w-full flex-1 items-start border-white/20">
					<nav
						class="flex h-full w-full flex-col p-2"
						aria-label="Chat history">
						<div class="mb-1 flex flex-row gap-2">
							<Button theme="orange" class="w-full">
								<Icon
									name="tabler:plus"
									class="h-4 w-4 mr-2" />New chat
							</Button>
						</div>
						<div
							class="flex-col flex-1 transition-opacity duration-500 overflow-y-auto">
							<div
								class="flex flex-col gap-2 pb-2 text-gray-100 text-sm">
								<div>
									<span>
										<div class="relative">
											<div class="sticky top-0 z-[16]">
												<h3
													class="h-9 pb-2 pt-3 px-1 text-xs text-gray-500 font-medium text-ellipsis overflow-hidden break-all">
													Today
												</h3>
											</div>
											<ol class="flex flex-col gap-2">
												<NuxtLink v-for="chat of chatsList"
														:key="chat.id" :to="`/chats/${chat.id}`">
													<Button
														theme="gray"
														class="w-full flex-row gap-2 !ring-dark-300 !font-normal">
														<Icon
															name="tabler:messages"
															class="w-4 h-4 shrink-0" />
														<span
															class="grow flex justify-start text-left whitespace-nowrap overflow-hidden text-ellipsis"
															>{{ chat.title }}</span
														>
														<Icon
															name="tabler:edit"
															class="w-4 h-4 shrink-0 cursor:pointer" />
														<Icon
															@click="deleteChat($event, chat.id)"
															title="Delete Chat"
															name="tabler:trash"
															class="w-4 h-4 shrink-0" />
													</Button>
												</NuxtLink>
											</ol>
										</div>
									</span>
								</div>
							</div>
						</div>
						<div class="pt-2 empty:hidden">
							<Button
								theme="gray"
								name=""
								class="flex flex-row gap-x-2 py-2 text-left w-full justify-between">
								<div class="flex items-center">
									<img
										class="inline-block h-9 w-9 rounded"
										:src="user?.avatar"
										alt="" />
									<div class="ml-3">
										<p
											class="text-sm font-medium text-gray-200 group-hover:text-gray-50">
											{{ user?.display_name }}
										</p>
										<p
											class="text-xs font-medium text-gray-400 group-hover:text-gray-200">
											View profile
										</p>
									</div>
								</div>
								<Icon
									name="ic:round-keyboard-arrow-down"
									:class="[
										'-mr-1 duration-200 h-5 w-5 text-gray-400',
										false ? 'rotate-0' : 'rotate-180',
									]"
									aria-hidden="true" />
							</Button>
						</div>
					</nav>
				</div>
			</div>
		</div>
	</div>
</template>