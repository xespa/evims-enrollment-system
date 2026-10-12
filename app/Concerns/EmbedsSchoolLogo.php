<?php

namespace App\Concerns;

trait EmbedsSchoolLogo
{
    /**
     * The school logo as a data URI, embedded so the PDF renderer never has
     * to fetch it over the network, and scaled down from the 1000px
     * original, which would otherwise make up most of the file's size.
     */
    protected function logoDataUri(int $size = 200): ?string
    {
        $path = public_path('images/logoevims.png');
        $original = is_file($path) ? imagecreatefrompng($path) : false;

        if ($original === false) {
            return null;
        }

        $logo = imagescale($original, $size, $size, IMG_BICUBIC);

        if ($logo === false) {
            return null;
        }

        imagealphablending($logo, false);
        imagesavealpha($logo, true);

        ob_start();
        imagepng($logo, null, 9);

        return 'data:image/png;base64,'.base64_encode((string) ob_get_clean());
    }
}
