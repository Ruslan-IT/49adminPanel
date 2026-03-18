<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckIfBlocked
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle($request, Closure $next)
    {
        if (auth()->check() && auth()->user()->is_blocked) {
            auth()->logout();

            return redirect('/login')->withErrors([
                'email' => 'Ваш аккаунт заблокирован.',
            ]);
        }

        return $next($request);
    }
}
