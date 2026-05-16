import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseUrl, getSupabasePublicKey } from "@/lib/supabase/env";

const PROTECTED = [
  "/dashboard",
  "/metas",
  "/ranking",
  "/mural",
  "/loja",
  "/perfil",
  "/notificacoes",
  "/configuracoes",
  "/mood",
  "/admin",
];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED.some((p) => path === p || path.startsWith(p + "/"));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (path === "/" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if ((path === "/login" || path === "/recuperar-senha") && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

// Roda só nas rotas que realmente precisam do gate auth (páginas + redirect /).
// /api/* já valida sessão dentro de cada handler, então pular o middleware lá
// elimina um round-trip ao Supabase Auth em toda chamada de API.
export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons|sounds|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|otf)$).*)",
  ],
};
