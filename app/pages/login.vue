<script setup lang="ts">
const supabase = useSupabaseClient();
const email = ref("");

// const signInWithOtp = async () => {
//   const { error } = await supabase.auth.signInWithOtp({
//     email: email.value,
//     options: {
//       emailRedirectTo: "http://localhost:3000/confirm",
//     },
//   });
//   if (error) console.log(error);
// };
//
//
// async function onSubmit() {
//   const { error } = await supabase.auth.signInWithOtp({
//     email: email.value,
//     options: {
//       emailRedirectTo: "http://localhost:3000/confirm",
//     },
//   });
//   if (error) console.log(error);
// }

async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: window.location.href.replace("/login", "/confirm"),
    },
  });
  if (error) console.log(error);
}
</script>

<template>
  <div class="mx-auto max-w-7xl p-4">
    <div>
      <button
        @click="signInWithGithub"
        class="rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
      >
        Github Login
      </button>
    </div>
  </div>
</template>
