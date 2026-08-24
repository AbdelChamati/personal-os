import React from 'react';
import { useTranslation } from 'react-i18next';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaMicrosoft } from 'react-icons/fa6';

const PROVIDERS = [
  { id: 'google', label: 'Google', Icon: FcGoogle },
  { id: 'microsoft', label: 'Microsoft', Icon: FaMicrosoft },
  { id: 'github', label: 'GitHub', Icon: FaGithub },
];

export default function SocialSignInButtons() {
  const { t } = useTranslation();

  return (
    <div className="social-sign-in">
      <div className="social-divider"><span>{t('auth.orContinueWith')}</span></div>
      <div className="social-provider-list">
        {PROVIDERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`social-provider social-provider-${id}`}
            onClick={() => window.location.assign(`/api/auth/oauth/${id}`)}
          >
            <Icon className="social-provider-icon" aria-hidden="true" />
            <span>{t(`auth.continueWith${label}`)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}