<?php

namespace App\Http\Controllers\Admin;

use App\Actions\Awards\DetermineAcademicAwards;
use App\Actions\Awards\GenerateAwardList;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexAwardRequest;
use Symfony\Component\HttpFoundation\Response;

/**
 * The printable list of awardees, for the grade level and recognition
 * chosen in a grade sheet's Awards dialog. Only students receiving a
 * recognition are printed.
 */
class AwardListPrintController extends Controller
{
    public function __invoke(IndexAwardRequest $request, DetermineAcademicAwards $determineAcademicAwards, GenerateAwardList $generateAwardList): Response
    {
        $schoolYear = $request->schoolYear();
        $recognition = in_array($request->recognition(), [IndexAwardRequest::NOT_QUALIFIED, IndexAwardRequest::INCOMPLETE, IndexAwardRequest::EVERYONE], true)
            ? IndexAwardRequest::RECOGNIZED
            : $request->recognition();

        $gradeLevels = DetermineAcademicAwards::onlyMatching(
            $determineAcademicAwards->handle($schoolYear, $request->gradeLevelId()),
            fn (array $student): bool => IndexAwardRequest::matches($student, $recognition),
        );

        return $generateAwardList->handle($schoolYear, $gradeLevels)->stream($generateAwardList->filename($schoolYear));
    }
}
