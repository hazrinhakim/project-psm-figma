import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

type ApiUser = {
  id: string;
  fullName: string;
  role: 'admin' | 'admin_assistant' | 'staff';
  email: string;
  createdAt: string | null;
};

type DbProfileRow = {
  id: string;
  full_name: string | null;
  role: 'admin' | 'admin_assistant' | 'staff';
  created_at: string | null;
};

function jsonResponse<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return errorResponse('Missing Supabase admin credentials.', 500);
  }

  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  if (usersError) {
    return errorResponse(usersError.message, 500);
  }

  const authUsers = usersData?.users ?? [];
  const ids = authUsers.map((user) => user.id);

  const { data: profilesData, error: profilesError } = await supabaseAdmin
    .from<DbProfileRow>('profiles')
    .select('id, full_name, role, created_at')
    .in('id', ids);

  if (profilesError) {
    return errorResponse(profilesError.message, 500);
  }

  const profilesMap = new Map(
    (profilesData || []).map((profile) => [profile.id, profile])
  );

  const response: ApiUser[] = authUsers.map((user) => {
    const profile = profilesMap.get(user.id);
    return {
      id: user.id,
      fullName: profile?.full_name ?? '',
      role: profile?.role ?? 'staff',
      email: user.email ?? '',
      createdAt: profile?.created_at ?? null
    };
  });

  return jsonResponse(response);
}

export async function POST(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return errorResponse('Missing Supabase admin credentials.', 500);
  }

  const body = await req.json();
  const email = String(body.email ?? '').trim();
  const role = String(body.role ?? 'staff').trim() as ApiUser['role'];
  const fullName = String(body.fullName ?? '').trim();

  if (!email) {
    return errorResponse('Email is required.');
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const redirectTo = `${siteUrl.replace(/\/$/, '')}/register`;

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      role,
      full_name: fullName
    }
  });

  if (error) {
    return errorResponse(error.message, 500);
  }

  if (data?.user?.id) {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: data.user.id, full_name: fullName, role }, { onConflict: 'id' });

    if (profileError) {
      return errorResponse(profileError.message, 500);
    }
  }

  return jsonResponse({
    id: data?.user?.id ?? '',
    fullName,
    role,
    email,
    createdAt: null
  });
}

export async function PATCH(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return errorResponse('Missing Supabase admin credentials.', 500);
  }

  const body = await req.json();
  const userId = String(body.userId ?? '').trim();
  const role = body.role as ApiUser['role'] | undefined;
  const fullName = body.fullName as string | undefined;

  if (!userId) {
    return errorResponse('User ID is required.');
  }

  const updatePayload: Partial<DbProfileRow> = {};
  if (role) updatePayload.role = role;
  if (fullName !== undefined) updatePayload.full_name = fullName;

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: userId, ...updatePayload }, { onConflict: 'id' });

    if (error) {
      return errorResponse(error.message, 500);
    }
  }

  const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  if (userError) {
    return errorResponse(userError.message, 500);
  }

  const { data: profile } = await supabaseAdmin
    .from<DbProfileRow>('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  return jsonResponse({
    id: user?.user?.id ?? userId,
    fullName: profile?.full_name ?? '',
    role: profile?.role ?? 'staff',
    email: user?.user?.email ?? '',
    createdAt: profile?.created_at ?? null
  });
}

export async function DELETE(req: Request) {
  const supabaseAdmin = createSupabaseAdminClient();
  if (!supabaseAdmin) {
    return errorResponse('Missing Supabase admin credentials.', 500);
  }

  const body = await req.json();
  const userId = String(body.userId ?? '').trim();

  if (!userId) {
    return errorResponse('User ID is required.');
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return errorResponse(deleteError.message, 500);
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    return errorResponse(profileError.message, 500);
  }

  return jsonResponse(null);
}
