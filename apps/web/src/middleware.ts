import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { requireEnv } from "@/lib/env";

// Rotas alcançáveis sem sessão. Todo o resto exige o dono logado.
const PUBLIC_PATHS = ["/entrar", "/acesso-negado", "/auth/callback"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Cliente próprio do middleware: lê cookies da request e regrava na
  // response, mantendo a sessão renovada para o resto da aplicação.
  const supabase = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getUser() valida o token no servidor do Supabase — diferente de
  // getSession(), que confia no cookie sem verificar.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path.startsWith(p));
  const isOwner = user !== null && user.email === requireEnv("OWNER_EMAIL");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  // Logado com conta errada: só enxerga /acesso-negado.
  if (user && !isOwner && path !== "/acesso-negado") {
    return NextResponse.redirect(new URL("/acesso-negado", request.url));
  }

  // Dono logado não tem por que ver as telas de auth.
  if (isOwner && (path === "/entrar" || path === "/acesso-negado")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  // Roda em tudo, menos assets estáticos do Next.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
