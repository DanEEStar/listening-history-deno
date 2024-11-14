<script setup lang="ts">

const supabase = useSupabaseClient();
const email = ref("");

const signInWithOtp = async () => {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: "http://localhost:3000/confirm",
    },
  });
  if (error) console.log(error);
};


async function onSubmit() {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.value,
    options: {
      emailRedirectTo: "http://localhost:3000/confirm",
    },
  });
  if (error) console.log(error);
}

async function signInWithGithub() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "https://listening-history-deno.deno.dev/confirm",
    },
  });
  if (error) console.log(error);
}

</script>

<template>
  <UContainer>
    <UForm class="space-y-4" @submit="onSubmit">
      <UFormGroup label="Email" name="email">
        <UInput v-model="email" />
      </UFormGroup>

      <UButton type="submit">
        Submit
      </UButton>
    </UForm>

    <div>
      <UButton @click="signInWithGithub">Github Login</UButton>
    </div>
  </UContainer>
</template>