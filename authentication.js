import { Clerk } from '@clerk/clerk-js';

const publishableKey = 'YOUR_CLERK_PUBLISHABLE_KEY';

const clerk = new Clerk(publishableKey);
await clerk.load();

if (clerk.user) {
    // User is signed in
    clerk.mountUserButton(document.getElementById('user-button'));
} else {
    // User is signed out
    clerk.mountSignIn(document.getElementById('sign-in'));
}
