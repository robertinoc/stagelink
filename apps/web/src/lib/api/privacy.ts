export interface PrivacyUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface UpdatePersonalDataPayload {
  firstName?: string;
  lastName?: string;
}

export interface UpdatePersonalDataResponse {
  user: PrivacyUser;
  requestId: string;
}

export interface DeleteAccountResponse {
  requestId: string;
  status: 'completed';
  deletedArtistCount: number;
  removedMembershipCount: number;
  retained: string[];
}

export async function updatePersonalData(
  payload: UpdatePersonalDataPayload,
): Promise<UpdatePersonalDataResponse> {
  const response = await fetch('/api/privacy/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response, 'Could not update your personal data.'));
  }

  return response.json() as Promise<UpdatePersonalDataResponse>;
}

export async function deleteAccount(confirmEmail: string): Promise<DeleteAccountResponse> {
  const response = await fetch('/api/privacy/account', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirmEmail }),
  });

  if (!response.ok) {
    throw new Error(await resolveErrorMessage(response, 'Could not delete your account.'));
  }

  return response.json() as Promise<DeleteAccountResponse>;
}

async function resolveErrorMessage(response: Response, fallback: string): Promise<string> {
  const payload = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  if (Array.isArray(payload?.message)) return payload.message.join(', ');
  return payload?.message ?? fallback;
}
