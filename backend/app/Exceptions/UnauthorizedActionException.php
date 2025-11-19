<?php

namespace App\Exceptions;

use Exception;
use Symfony\Component\HttpFoundation\Response;

class UnauthorizedActionException extends Exception
{
    protected $message = 'You are not authorized to perform this action';
    protected $code = Response::HTTP_FORBIDDEN;
}
