module.exports = {

"[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"40345ca53538fa85c76ef155f22942baa3aeea00ea":"getLiveIncidents"},"",""] */ __turbopack_context__.s({
    "getLiveIncidents": (()=>getLiveIncidents)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function getLiveIncidents(location) {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
        return {
            success: false,
            error: 'Perplexity API key is not configured. Please add PERPLEXITY_API_KEY to your .env file.'
        };
    }
    const url = "https://api.perplexity.ai/chat/completions";
    // The prompt is now more focused and requests a response based on web search.
    const userPrompt = `Find latest civic incidents or disruptions from the last 2 days near ${location.address}. Consolidate multiple reports of the same event into a single summary. Focus on events affecting commute like protests, tree fall, water flooding, or traffic regulation changes.`;
    const payload = {
        model: "sonar",
        messages: [
            {
                "role": "user",
                "content": userPrompt
            }
        ]
    };
    const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
    };
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: headers
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.error?.message || 'Perplexity API request failed');
        }
        // The core issue was trying to parse choice.message.content.
        // The correct approach is to use the structured `search_results`.
        if (!responseData.search_results || !Array.isArray(responseData.search_results)) {
            throw new Error('Invalid response structure from Perplexity API: search_results is missing.');
        }
        const incidentsArray = responseData.search_results;
        const dataWithTimeAgo = incidentsArray.map((item, index)=>({
                id: `live-${index}-${new Date().getTime()}`,
                source: 'Web',
                title: item.title,
                summary: 'Source: ' + new URL(item.url).hostname,
                url: item.url,
                timestamp: new Date().toISOString(),
                timeAgo: 'Just now',
                location: location.address
            }));
        return {
            success: true,
            data: dataWithTimeAgo
        };
    } catch (error) {
        console.error("Error fetching live incidents:", error);
        return {
            success: false,
            error: error.message || "An unknown error occurred."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getLiveIncidents
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getLiveIncidents, "40345ca53538fa85c76ef155f22942baa3aeea00ea", null);
}}),
"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"405bbe91130606ed9b9d33a6350719f17e88c55e52":"getPlaceDetails","703d691f6a2d8afc25d950676f09476be54bcf8a08":"autocompletePlaces"},"",""] */ __turbopack_context__.s({
    "autocompletePlaces": (()=>autocompletePlaces),
    "getPlaceDetails": (()=>getPlaceDetails)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$app$2d$render$2f$encryption$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/app-render/encryption.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function autocompletePlaces(query, location, types) {
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyALeVX7nnyw8fbIzPZLu-rkyMy5MlgWi5o");
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    }
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey
    };
    const body = JSON.stringify({
        input: query,
        includedPrimaryTypes: types,
        ...location && {
            locationRestriction: {
                circle: {
                    center: {
                        latitude: location.lat,
                        longitude: location.lng
                    },
                    radius: 10000.0
                }
            }
        }
    });
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body
        });
        const data = await response.json();
        if (data.error || !data.suggestions) {
            return {
                success: false,
                error: `Places Autocomplete error: ${data.error?.message || 'No results'}`
            };
        }
        const predictions = data.suggestions.map((prediction)=>({
                placeId: prediction.placePrediction.place,
                description: prediction.placePrediction.text.text
            }));
        return {
            success: true,
            data: predictions
        };
    } catch (e) {
        console.error("Error fetching autocomplete places:", e);
        return {
            success: false,
            error: 'An unknown error occurred while fetching autocomplete results.'
        };
    }
}
async function getPlaceDetails(placeId) {
    const apiKey = ("TURBOPACK compile-time value", "AIzaSyALeVX7nnyw8fbIzPZLu-rkyMy5MlgWi5o");
    if ("TURBOPACK compile-time falsy", 0) {
        "TURBOPACK unreachable";
    }
    const url = `https://places.googleapis.com/v1/${placeId}`;
    const headers = {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'displayName,formattedAddress,location'
    };
    try {
        const response = await fetch(url, {
            headers
        });
        const data = await response.json();
        if (data.error) {
            return {
                success: false,
                error: `Place Details error: ${data.error?.message || 'Not found'}`
            };
        }
        const details = {
            name: data.displayName.text,
            address: data.formattedAddress,
            location: {
                lat: data.location.latitude,
                lng: data.location.longitude
            }
        };
        return {
            success: true,
            data: details
        };
    } catch (e) {
        console.error("Error fetching place details:", e);
        return {
            success: false,
            error: 'An unknown error occurred while fetching place details.'
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    autocompletePlaces,
    getPlaceDetails
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(autocompletePlaces, "703d691f6a2d8afc25d950676f09476be54bcf8a08", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getPlaceDetails, "405bbe91130606ed9b9d33a6350719f17e88c55e52", null);
}}),
"[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/places-service.ts [app-rsc] (ecmascript)");
;
;
;
}}),
"[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/places-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <exports>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "40345ca53538fa85c76ef155f22942baa3aeea00ea": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getLiveIncidents"]),
    "405bbe91130606ed9b9d33a6350719f17e88c55e52": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getPlaceDetails"]),
    "703d691f6a2d8afc25d950676f09476be54bcf8a08": (()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["autocompletePlaces"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/places-service.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
}}),
"[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => \"[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/src/lib/places-service.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "40345ca53538fa85c76ef155f22942baa3aeea00ea": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["40345ca53538fa85c76ef155f22942baa3aeea00ea"]),
    "405bbe91130606ed9b9d33a6350719f17e88c55e52": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["405bbe91130606ed9b9d33a6350719f17e88c55e52"]),
    "703d691f6a2d8afc25d950676f09476be54bcf8a08": (()=>__TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__["703d691f6a2d8afc25d950676f09476be54bcf8a08"])
});
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <module evaluation>');
var __TURBOPACK__imported__module__$5b$project$5d2f2e$next$2d$internal$2f$server$2f$app$2f$live$2d$agent$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$live$2d$incidents$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$src$2f$lib$2f$places$2d$service$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$exports$3e$__ = __turbopack_context__.i('[project]/.next-internal/server/app/live-agent/page/actions.js { ACTIONS_MODULE0 => "[project]/src/lib/live-incidents-service.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/src/lib/places-service.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <exports>');
}}),
"[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/favicon.ico.mjs { IMAGE => \"[project]/src/app/favicon.ico (static in ecmascript)\" } [app-rsc] (structured image object, ecmascript)"));
}}),
"[project]/src/app/layout.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/layout.tsx [app-rsc] (ecmascript)"));
}}),
"[project]/src/app/live-agent/page.tsx (client reference/proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/live-agent/page.tsx <module evaluation> from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/live-agent/page.tsx <module evaluation>", "default");
}}),
"[project]/src/app/live-agent/page.tsx (client reference/proxy)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>__TURBOPACK__default__export__)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server-edge.js [app-rsc] (ecmascript)");
;
const __TURBOPACK__default__export__ = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2d$edge$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call the default export of [project]/src/app/live-agent/page.tsx from the server, but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/app/live-agent/page.tsx", "default");
}}),
"[project]/src/app/live-agent/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$live$2d$agent$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/app/live-agent/page.tsx (client reference/proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$live$2d$agent$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__ = __turbopack_context__.i("[project]/src/app/live-agent/page.tsx (client reference/proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$app$2f$live$2d$agent$2f$page$2e$tsx__$28$client__reference$2f$proxy$29$__);
}}),
"[project]/src/app/live-agent/page.tsx [app-rsc] (ecmascript, Next.js server component)": ((__turbopack_context__) => {

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.n(__turbopack_context__.i("[project]/src/app/live-agent/page.tsx [app-rsc] (ecmascript)"));
}}),

};

//# sourceMappingURL=_aa638a07._.js.map