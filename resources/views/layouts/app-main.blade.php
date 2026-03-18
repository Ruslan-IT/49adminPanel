<!DOCTYPE html>
<html lang="ru">
<head>

    <meta charset="UTF-8">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>@yield('seo_title', config('app.name'))</title>

    <meta name="description" content="@yield('seo_description', 'Personal portfolio website')">
    <meta name="keywords" content="@yield('seo_keywords', 'portfolio, web developer')">
    <meta name="author" content="{{ config('app.name') }}">

    <link rel="canonical" href="{{ url()->current() }}">

    <!-- Open Graph (Facebook / Telegram / LinkedIn) -->
    <meta property="og:title" content="@yield('seo_title', config('app.name'))">
    <meta property="og:description" content="@yield('seo_description', 'Personal portfolio website')">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ url()->current() }}">
    <meta property="og:image" content="@yield('seo_image', asset('images/seo-preview.jpg'))">
    <meta property="og:site_name" content="{{ config('app.name') }}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="@yield('seo_title', config('app.name'))">
    <meta name="twitter:description" content="@yield('seo_description', 'Personal portfolio website')">
    <meta name="twitter:image" content="@yield('seo_image', asset('images/seo-preview.jpg'))">

    <!-- Favicon -->
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/png">



    <!-- Правильный PWA манифест (без CORS) -->
    <link rel="manifest" href="data:application/manifest+json,%7B%22name%22%3A%22%D0%A0%D0%B5%D0%BC%D0%A1%D1%82%D1%80%D0%BE%D0%B9%22%2C%22short_name%22%3A%22%D0%A0%D0%B5%D0%BC%D0%A1%D1%82%D1%80%D0%BE%D0%B9%22%2C%22start_url%22%3A%22.%22%2C%22display%22%3A%22standalone%22%2C%22background_color%22%3A%22%230a0c10%22%2C%22theme_color%22%3A%22%232a9d8f%22%2C%22icons%22%3A%5B%7B%22src%22%3A%22data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232a9d8f'/%3E%3Ctext x='50' y='70' font-size='70' text-anchor='middle' fill='white' font-family='Arial'%3E🏗️%3C/text%3E%3C/svg%3E%22%2C%22sizes%22%3A%22192x192%22%2C%22type%22%3A%22image/svg+xml%22%7D%5D%7D">
    <meta name="theme-color" content="#2a9d8f">

    <!-- Chart.js, XLSX, FontAwesome, AWS SDK -->
    <script type="text/javascript" src="https://gc.kis.v2.scr.kaspersky-labs.com/FD126C42-EBFA-4E12-B309-BB3FDD723AC1/main.js?attr=RpaVjD3bIF8WbWOWToRKDHgMniLb3NXd9Wm6BPCDp3n3mn4IDHAfdlbUT4MmLRgOWhYwtVhjxOaSQb-cJz_RdalT83gRItEfCi_WIuBSBGxueM7OpoJBpq1M-Em9csiwxooT4Chi6tixLTj6MhBy0IsgeTiZ5Uo8p0MSUj41oo6tAf294-AhDEgReM7dGdUA1qylUNUng-9mfJqmAehHCv7ZRTozo2S6cNhljdxXw8ajJMCtMlf79iW_DkRQ_5hDn_v_g-aiFLA6xNlBbTKTHdjnNiTuMTVuN_8vLIrzrNRvEql28sw8F0nO8JX256MijaUTDsuND9HVHOd8eww2q_J9JHVMy_mG7ZFrlRAmFOHAm6dS4D5FYP-GTkRVmhjIBkBhqzggfVJxUiENaRK4lVhksoRLUV3avrBw4rVOqzQ95cpIxl0cx9ZaLCNxVe4WcuO2_rYCAzbmE4hsR0sWTeBDudJH6Pzt1NCL9Bzwi_TrFzCMfIt6fgAJb2BO33F3wk2bZD4KYUfKUJpHm5ekRQ" charset="UTF-8"></script><link rel="stylesheet" crossorigin="anonymous" href="https://gc.kis.v2.scr.kaspersky-labs.com/E3E8934C-235A-4B0E-825A-35A08381A191/abn/main.css?attr=aHR0cHM6Ly9zdG9yYWdlLnlhbmRleGNsb3VkLm5ldC9icmlnYWRpcm9uLnJ1L2luZGV4Lmh0bWw_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1ZQ0FKRUZrWTZ2NmwzbzdHOUJBRVFteVBWJTJmMjAyNjAzMTUlMmZydS1jZW50cmFsMSUyZnMzJTJmYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNjAzMTVUMTQ0OTQzWiZYLUFtei1FeHBpcmVzPTM2MDAmWC1BbXotU2lnbmF0dXJlPWQ0YmM3OTk5NzI5ZmY4MmQzM2Q2YmY2YzQ2OWI2N2QyZTgxNDg3NzE4Nzc5NGJlOWNkM2JjMGE0MjNjMTBlNjEmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0JnJlc3BvbnNlLWNvbnRlbnQtZGlzcG9zaXRpb249YXR0YWNobWVudA"/><script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0/dist/chartjs-plugin-datalabels.min.js"></script>
    <script src="https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js"></script>
    <script src="https://sdk.amazonaws.com/js/aws-sdk-2.1048.0.min.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">

    <!-- CSS -->
    <link rel="preload" href="/assets/css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">


</head>
<body class="">
<!-- Основной контент -->



@yield('content')


<script src="/assets/js/main.js" defer></script>

</body>
</html>
