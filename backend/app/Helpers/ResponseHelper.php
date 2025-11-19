<?php

namespace App\Helpers;

class ResponseHelper
{
    /**
     * Standard success response structure
     *
     * @param mixed $data
     * @param string $message
     * @return array
     */
    public static function success($data, string $message = 'Success'): array
    {
        return [
            'success' => true,
            'message' => $message,
            'data' => $data,
        ];
    }

    /**
     * Standard error response structure
     *
     * @param string $message
     * @param mixed $errors
     * @return array
     */
    public static function error(string $message, $errors = null): array
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return $response;
    }

    /**
     * Paginated response structure
     *
     * @param mixed $data
     * @param array $pagination
     * @return array
     */
    public static function paginated($data, array $pagination): array
    {
        return [
            'success' => true,
            'data' => $data,
            'pagination' => $pagination,
        ];
    }
}
