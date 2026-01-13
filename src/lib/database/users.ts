import { User } from '../../App';

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

async function handleResponse<T>(res: Response): Promise<T> {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok || payload.error) {
    const message = payload.error || `Request failed with status ${res.status}`;
    throw new Error(message);
  }
  return payload.data as T;
}

export async function getUsers(): Promise<User[]> {
  const res = await fetch('/api/admin/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  });

  return handleResponse<User[]>(res);
}

export async function createUser(user: Pick<User, 'email' | 'role' | 'fullName'>): Promise<User> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(user)
  });

  return handleResponse<User>(res);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User> {
  const res = await fetch('/api/admin/users', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: id, ...updates })
  });

  return handleResponse<User>(res);
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch('/api/admin/users', {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId: id })
  });

  await handleResponse<null>(res);
}

