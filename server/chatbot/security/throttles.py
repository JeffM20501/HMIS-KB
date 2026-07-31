"""
Rate limiting for the chat endpoint — completely absent in the previous
implementation (`permission_classes = [AllowAny]`, no throttle classes at
all), despite the endpoint doing real work per request (an embedding call
plus an LLM call, both of which cost money/quota).

Two scopes:
- `chat_anon`: per-IP, for unauthenticated visitors on the public help
  center (the chat widget is embedded there too, per the PRD).
- `chat_user`: per-authenticated-user, deliberately more generous since
  logged-in staff are a much lower abuse risk than anonymous traffic.

Rates are set in DRF's DEFAULT_THROTTLE_RATES (see app/settings.py) rather
than hardcoded here, so they can be tuned via settings without a code
change.
"""
from rest_framework.throttling import SimpleRateThrottle


class ChatAnonRateThrottle(SimpleRateThrottle):
    scope = 'chat_anon'

    def get_cache_key(self, request, view):
        if request.user and request.user.is_authenticated:
            return None  # let ChatUserRateThrottle handle authenticated users
        ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


class ChatUserRateThrottle(SimpleRateThrottle):
    scope = 'chat_user'

    def get_cache_key(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return None
        return self.cache_format % {'scope': self.scope, 'ident': request.user.pk}
