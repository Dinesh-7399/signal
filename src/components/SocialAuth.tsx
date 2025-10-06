'use client';

import { Button } from "./ui/button";
import { SiGoogle, SiGithub, SiFacebook } from "react-icons/si";
import React from "react";
import { signInWithSocial } from "@/lib/actions/auth.actions";

const providerConfig = {
  google: {
    icon: <SiGoogle className="w-5 h-5" />,
    label: "Google",
    color: "#4285F4"
  },
  github: {
    icon: <SiGithub className="w-5 h-5" />,
    label: "GitHub",
    color: "#181717"
  },
  facebook: {
    icon: <SiFacebook className="w-5 h-5" />,
    label: "Facebook",
    color: "#1877F2"
  },
};

type SocialProvider = keyof typeof providerConfig;

interface SocialAuthProps {
  providers?: SocialProvider[];
}

export const SocialAuth = ({ providers = ['google', 'github', 'facebook'] }: SocialAuthProps) => {
  return (
    <div className="flex flex-col gap-3">
      {providers.map((provider) => (
        <form action={signInWithSocial} key={provider}>
          <input type="hidden" name="provider" value={provider} />
          <Button
            type="submit"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 hover:bg-accent"
          >
            {providerConfig[provider].icon}
            <span className="font-medium">Continue with {providerConfig[provider].label}</span>
          </Button>
        </form>
      ))}
    </div>
  );
};